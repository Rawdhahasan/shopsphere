-- =============================================================================
-- ShopSphere · 002 · Functions & triggers
-- Business rules enforced by the database itself, so they hold even if
-- application code has a bug.
--
-- "Privileged context" means the query is NOT running as a normal website
-- visitor (anon / authenticated). That covers the service role used by the
-- Stripe webhook, the SQL editor, and SECURITY DEFINER functions below.
-- =============================================================================

create function public.is_privileged_context()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user not in ('anon', 'authenticated');
$$;

-- True when the signed-in user has the admin role. Used by RLS policies.
-- SECURITY DEFINER so it can read profiles without recursing into RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- updated_at timestamps
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'addresses', 'categories', 'products', 'product_variants',
    'cart_items', 'discount_codes', 'orders', 'reviews', 'store_settings'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
-- Every new auth user gets a profile with the 'customer' role.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    left(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 120)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync when a user changes their login email.
create function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Customers may edit their name/phone/avatar, never their role or email.
create function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_privileged_context() or public.is_admin() then
    return new;
  end if;
  if (new.id, new.role, new.email) is distinct from (old.id, old.role, old.email) then
    raise exception 'You cannot change your role or email here.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------------------------
-- Addresses: exactly one default per user
-- ---------------------------------------------------------------------------
create function public.manage_default_address()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- A user's first address becomes their default automatically.
  if tg_op = 'INSERT' and not exists (
    select 1 from public.addresses where user_id = new.user_id
  ) then
    new.is_default := true;
  end if;

  if new.is_default then
    update public.addresses
    set is_default = false
    where user_id = new.user_id and id <> new.id and is_default;
  end if;
  return new;
end;
$$;

create trigger manage_default_address
  before insert or update of is_default on public.addresses
  for each row execute function public.manage_default_address();

-- ---------------------------------------------------------------------------
-- Products: keep price range and total stock in sync with variants
-- ---------------------------------------------------------------------------
create function public.refresh_product_variant_stats(p_product_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.products p
  set min_price_cents = s.min_price,
      max_price_cents = s.max_price,
      total_stock     = s.stock
  from (
    select min(price_cents) as min_price,
           max(price_cents) as max_price,
           coalesce(sum(stock_quantity), 0)::integer as stock
    from public.product_variants
    where product_id = p_product_id and is_active
  ) s
  where p.id = p_product_id;
$$;

create function public.on_variant_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_product_variant_stats(new.product_id);
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and new.product_id is distinct from old.product_id) then
    perform public.refresh_product_variant_stats(old.product_id);
  end if;
  return null;
end;
$$;

create trigger on_variant_change
  after insert or update or delete on public.product_variants
  for each row execute function public.on_variant_change();

-- Admin stock adjustments: changes stock and writes the audit log in one step.
create function public.adjust_variant_stock(
  p_variant_id uuid,
  p_change integer,
  p_reason public.inventory_reason,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_quantity integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can adjust stock.' using errcode = '42501';
  end if;
  if p_change = 0 then
    raise exception 'Stock change cannot be zero.' using errcode = '22023';
  end if;
  if p_reason not in ('restock', 'adjustment', 'return') then
    raise exception 'Invalid reason for a manual stock change.' using errcode = '22023';
  end if;

  update public.product_variants
  set stock_quantity = stock_quantity + p_change
  where id = p_variant_id and stock_quantity + p_change >= 0
  returning stock_quantity into new_quantity;

  if new_quantity is null then
    raise exception 'Variant not found or stock would go below zero.' using errcode = '22023';
  end if;

  insert into public.inventory_movements (variant_id, quantity_change, reason, note, created_by)
  values (p_variant_id, p_change, p_reason, p_note, auth.uid());

  return new_quantity;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
-- Has the signed-in user bought this product (in a paid order)?
create function public.has_purchased_product(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.user_id = (select auth.uid())
      and oi.product_id = p_product_id
      and o.status in ('paid', 'processing', 'shipped', 'delivered')
  );
$$;

-- Customers can't approve their own reviews or fake the verified badge.
-- Editing a review sends it back to moderation.
create function public.guard_review()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  admin boolean := public.is_admin();
begin
  if public.is_privileged_context() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_verified_purchase := public.has_purchased_product(new.product_id);
    if not admin then
      new.status := 'pending';
      new.moderated_by := null;
      new.moderated_at := null;
    end if;
    return new;
  end if;

  if (new.product_id, new.user_id, new.is_verified_purchase)
     is distinct from (old.product_id, old.user_id, old.is_verified_purchase) then
    raise exception 'These review fields cannot be changed.' using errcode = '42501';
  end if;

  if admin then
    if new.status is distinct from old.status then
      new.moderated_by := auth.uid();
      new.moderated_at := now();
    end if;
  else
    if (new.status, new.moderated_by, new.moderated_at)
       is distinct from (old.status, old.moderated_by, old.moderated_at) then
      raise exception 'Only admins can moderate reviews.' using errcode = '42501';
    end if;
    if (new.rating, new.title, new.body) is distinct from (old.rating, old.title, old.body) then
      new.status := 'pending';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_review
  before insert or update on public.reviews
  for each row execute function public.guard_review();

-- Product rating = average of APPROVED reviews only.
create function public.refresh_product_rating(p_product_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.products p
  set avg_rating   = coalesce(s.avg_rating, 0),
      review_count = s.review_count
  from (
    select round(avg(rating)::numeric, 2) as avg_rating, count(*)::integer as review_count
    from public.reviews
    where product_id = p_product_id and status = 'approved'
  ) s
  where p.id = p_product_id;
$$;

create function public.on_review_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_product_rating(new.product_id);
  end if;
  if tg_op = 'DELETE' then
    perform public.refresh_product_rating(old.product_id);
  end if;
  return null;
end;
$$;

create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.on_review_change();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
-- Admins (through the website) may only advance fulfilment and add tracking.
-- Payment state and money fields change only from trusted server code
-- (the Stripe webhook), never from a browser session.
create function public.guard_order_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_privileged_context() then
    return new;
  end if;

  if (new.order_number, new.user_id, new.email, new.currency, new.subtotal_cents,
      new.discount_cents, new.shipping_cents, new.tax_cents, new.total_cents,
      new.discount_code_id, new.discount_code, new.shipping_address,
      new.stripe_checkout_session_id, new.stripe_payment_intent_id,
      new.reservation_expires_at, new.paid_at)
     is distinct from
     (old.order_number, old.user_id, old.email, old.currency, old.subtotal_cents,
      old.discount_cents, old.shipping_cents, old.tax_cents, old.total_cents,
      old.discount_code_id, old.discount_code, old.shipping_address,
      old.stripe_checkout_session_id, old.stripe_payment_intent_id,
      old.reservation_expires_at, old.paid_at) then
    raise exception 'Order payment details cannot be edited.' using errcode = '42501';
  end if;

  if new.status is distinct from old.status and not (
       (old.status = 'paid' and new.status in ('processing', 'shipped'))
    or (old.status = 'processing' and new.status = 'shipped')
    or (old.status = 'shipped' and new.status = 'delivered')
  ) then
    raise exception 'Invalid order status change: % → %', old.status, new.status using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger guard_order_update
  before update on public.orders
  for each row execute function public.guard_order_update();

-- Stamp the matching timestamp when an order changes status.
create function public.stamp_order_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    case new.status
      when 'paid' then new.paid_at := coalesce(new.paid_at, now());
      when 'shipped' then new.shipped_at := coalesce(new.shipped_at, now());
      when 'delivered' then new.delivered_at := coalesce(new.delivered_at, now());
      when 'cancelled' then new.cancelled_at := coalesce(new.cancelled_at, now());
      else null;
    end case;
  end if;
  return new;
end;
$$;

-- Runs after guard_order_update (triggers fire in name order).
create trigger stamp_order_status
  before update of status on public.orders
  for each row execute function public.stamp_order_status();

-- Record every status in the tracking timeline.
create function public.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return null;
end;
$$;

create trigger log_order_status
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- ---------------------------------------------------------------------------
-- Function permissions
-- ---------------------------------------------------------------------------
-- Supabase lets every role execute public functions by default. Internal
-- helpers are locked down; only the ones the app or RLS needs stay callable.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_privileged_context() to anon, authenticated;
grant execute on function public.has_purchased_product(uuid) to authenticated;
grant execute on function public.adjust_variant_stock(uuid, integer, public.inventory_reason, text) to authenticated;
