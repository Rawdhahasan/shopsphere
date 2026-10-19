-- Checkout: atomic stock reservation, payment and release.
--
-- Only trusted server code (the service role) calls these. The app computes
-- totals with calculateOrderTotals() from database prices; reserve_order()
-- re-checks every price and the stock in the same transaction, so an order
-- can never be created with a stale price or sell stock that isn't there.

-- ---------------------------------------------------------------------------
-- reserve_order: create a pending order and hold its stock
-- ---------------------------------------------------------------------------
create function public.reserve_order(
  p_user_id uuid,
  p_email text,
  p_lines jsonb,
  p_subtotal_cents integer,
  p_discount_cents integer,
  p_shipping_cents integer,
  p_tax_cents integer,
  p_total_cents integer,
  p_discount_code_id uuid,
  p_discount_code text,
  p_shipping_address jsonb,
  p_reservation_expires_at timestamptz
)
returns table (order_id uuid, order_number text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_order_id uuid;
  v_order_number text;
  v_line jsonb;
  v_variant record;
  v_quantity integer;
  v_price integer;
begin
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = '22023';
  end if;

  insert into public.orders (
    user_id, email, status, subtotal_cents, discount_cents, shipping_cents, tax_cents,
    total_cents, discount_code_id, discount_code, shipping_address, reservation_expires_at
  ) values (
    p_user_id, p_email, 'pending_payment', p_subtotal_cents, p_discount_cents, p_shipping_cents,
    p_tax_cents, p_total_cents, p_discount_code_id, p_discount_code, p_shipping_address,
    p_reservation_expires_at
  )
  returning id, orders.order_number into v_order_id, v_order_number;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_quantity := (v_line ->> 'quantity')::integer;
    v_price := (v_line ->> 'unit_price_cents')::integer;

    -- Lock the variant row, then check it is still for sale at this price and in stock.
    select pv.id, pv.product_id, pv.sku, pv.title, pv.price_cents, pv.stock_quantity, p.name, p.status
      into v_variant
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
     where pv.id = (v_line ->> 'variant_id')::uuid and pv.is_active
     for update of pv;

    if v_variant.id is null or v_variant.status <> 'active' then
      raise exception 'UNAVAILABLE:%', v_line ->> 'variant_id' using errcode = 'P0001';
    end if;
    if v_variant.price_cents <> v_price then
      raise exception 'PRICE_CHANGED:%', v_variant.sku using errcode = 'P0001';
    end if;
    if v_variant.stock_quantity < v_quantity then
      raise exception 'OUT_OF_STOCK:%', v_variant.sku using errcode = 'P0001';
    end if;

    update public.product_variants
       set stock_quantity = stock_quantity - v_quantity
     where id = v_variant.id;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, variant_title, sku, image_path,
      unit_price_cents, quantity, line_total_cents
    ) values (
      v_order_id, v_variant.product_id, v_variant.id, v_variant.name,
      nullif(v_variant.title, 'Default'), v_variant.sku, v_line ->> 'image_path',
      v_price, v_quantity, v_price * v_quantity
    );

    insert into public.inventory_movements (variant_id, quantity_change, reason, order_id, note)
    values (v_variant.id, -v_quantity, 'reservation', v_order_id, v_order_number);
  end loop;

  if (select coalesce(sum(line_total_cents), 0) from public.order_items where order_items.order_id = v_order_id)
     <> p_subtotal_cents then
    raise exception 'SUBTOTAL_MISMATCH' using errcode = 'P0001';
  end if;

  return query select v_order_id, v_order_number;
end;
$$;

-- ---------------------------------------------------------------------------
-- mark_order_paid: idempotent; true only the first time
-- ---------------------------------------------------------------------------
create function public.mark_order_paid(
  p_order_id uuid,
  p_checkout_session_id text default null,
  p_payment_intent_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null or v_order.status <> 'pending_payment' then
    return false;
  end if;

  update public.orders
     set status = 'paid',
         stripe_checkout_session_id = coalesce(p_checkout_session_id, stripe_checkout_session_id),
         stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
         reservation_expires_at = null
   where id = p_order_id;

  if v_order.discount_code_id is not null then
    update public.discount_codes
       set redemption_count = redemption_count + 1
     where id = v_order.discount_code_id
       and (max_redemptions is null or redemption_count < max_redemptions);
  end if;

  -- The purchased items leave the shopper's cart.
  if v_order.user_id is not null then
    delete from public.cart_items c
     using public.order_items i
     where i.order_id = p_order_id
       and c.user_id = v_order.user_id
       and c.variant_id = i.variant_id;
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- release_order: cancel an unpaid order and return its stock
-- ---------------------------------------------------------------------------
create function public.release_order(p_order_id uuid, p_note text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null or v_order.status <> 'pending_payment' then
    return false;
  end if;

  for v_item in
    select variant_id, quantity from public.order_items
     where order_id = p_order_id and variant_id is not null
  loop
    update public.product_variants
       set stock_quantity = stock_quantity + v_item.quantity
     where id = v_item.variant_id;
    insert into public.inventory_movements (variant_id, quantity_change, reason, order_id, note)
    values (v_item.variant_id, v_item.quantity, 'reservation_release', p_order_id,
            coalesce(p_note, v_order.order_number));
  end loop;

  update public.orders
     set status = 'cancelled', reservation_expires_at = null
   where id = p_order_id;
  return true;
end;
$$;

revoke execute on function public.reserve_order(uuid, text, jsonb, integer, integer, integer, integer, integer, uuid, text, jsonb, timestamptz) from public, anon, authenticated;
revoke execute on function public.mark_order_paid(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.release_order(uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_order(uuid, text, jsonb, integer, integer, integer, integer, integer, uuid, text, jsonb, timestamptz) to service_role;
grant execute on function public.mark_order_paid(uuid, text, text) to service_role;
grant execute on function public.release_order(uuid, text) to service_role;
