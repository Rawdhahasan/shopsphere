-- =============================================================================
-- ShopSphere · 003 · Row-Level Security
-- RLS is the last line of defence: even if app code forgets a check, Postgres
-- refuses to return or change rows the current user isn't allowed to touch.
--
--   anon          = signed-out visitor (publishable key, no session)
--   authenticated = any signed-in user; admins are authenticated + is_admin()
--   service_role  = trusted server code; bypasses RLS entirely
--
-- `(select auth.uid())` is wrapped in a sub-select so Postgres evaluates it
-- once per query instead of once per row.
-- =============================================================================

alter table public.profiles                enable row level security;
alter table public.addresses               enable row level security;
alter table public.categories              enable row level security;
alter table public.products                enable row level security;
alter table public.product_images          enable row level security;
alter table public.product_options         enable row level security;
alter table public.product_option_values   enable row level security;
alter table public.product_variants        enable row level security;
alter table public.product_variant_options enable row level security;
alter table public.cart_items              enable row level security;
alter table public.wishlist_items          enable row level security;
alter table public.discount_codes          enable row level security;
alter table public.orders                  enable row level security;
alter table public.order_items             enable row level security;
alter table public.order_status_history    enable row level security;
alter table public.reviews                 enable row level security;
alter table public.inventory_movements     enable row level security;
alter table public.store_settings          enable row level security;
alter table public.stripe_events           enable row level security;

-- ---------------------------------------------------------------------------
-- Table privileges (defence in depth on top of RLS)
-- ---------------------------------------------------------------------------
-- Signed-out visitors never write anything.
revoke insert, update, delete, truncate on all tables in schema public from anon;
-- These tables are written only by trusted server code or SECURITY DEFINER functions.
revoke insert, update, delete, truncate on public.orders, public.order_items,
  public.order_status_history, public.inventory_movements from authenticated;
revoke all on public.stripe_events from anon, authenticated;
-- Updating an order (status/tracking) is the one write admins make through RLS.
grant update on public.orders to authenticated;

-- ---------------------------------------------------------------------------
-- Profiles & addresses
-- ---------------------------------------------------------------------------
create policy "Users read own profile; admins read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Users update own profile; admins update any"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "Users read own addresses; admins read all"
  on public.addresses for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Users add own addresses"
  on public.addresses for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users update own addresses"
  on public.addresses for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users delete own addresses"
  on public.addresses for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Catalog: everyone reads what's published; only admins write
-- ---------------------------------------------------------------------------
create policy "Anyone reads active categories; admins read all"
  on public.categories for select to anon, authenticated
  using (is_active or (select public.is_admin()));

create policy "Admins manage categories"
  on public.categories for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone reads active products; admins read all"
  on public.products for select to anon, authenticated
  using (status = 'active' or (select public.is_admin()));

create policy "Admins manage products"
  on public.products for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone reads images of visible products"
  on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

create policy "Admins manage product images"
  on public.product_images for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone reads options of visible products"
  on public.product_options for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));

create policy "Admins manage product options"
  on public.product_options for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone reads option values of visible products"
  on public.product_option_values for select to anon, authenticated
  using (exists (select 1 from public.product_options o where o.id = option_id));

create policy "Admins manage option values"
  on public.product_option_values for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone reads active variants of visible products; admins read all"
  on public.product_variants for select to anon, authenticated
  using (
    (is_active and exists (select 1 from public.products p where p.id = product_id))
    or (select public.is_admin())
  );

create policy "Admins manage variants"
  on public.product_variants for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone reads option links of visible variants"
  on public.product_variant_options for select to anon, authenticated
  using (exists (select 1 from public.product_variants v where v.id = variant_id));

create policy "Admins manage variant option links"
  on public.product_variant_options for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- (Sub-selects above run with the caller's RLS, so "visible" means
-- "the caller is allowed to see the parent row".)

-- ---------------------------------------------------------------------------
-- Cart & wishlist: strictly private to their owner
-- ---------------------------------------------------------------------------
create policy "Users read own cart"
  on public.cart_items for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users add visible variants to own cart"
  on public.cart_items for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.product_variants v where v.id = variant_id)
  );

create policy "Users update own cart"
  on public.cart_items for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users remove from own cart"
  on public.cart_items for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Users read own wishlist"
  on public.wishlist_items for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users add visible products to own wishlist"
  on public.wishlist_items for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.products p where p.id = product_id)
  );

create policy "Users remove from own wishlist"
  on public.wishlist_items for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Discount codes: admin-only. Customers' codes are validated on the server.
-- ---------------------------------------------------------------------------
create policy "Admins manage discount codes"
  on public.discount_codes for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Orders: customers read their own; only the server creates them
-- ---------------------------------------------------------------------------
create policy "Users read own orders; admins read all"
  on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Admins update order fulfilment"
  on public.orders for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Users read items of own orders; admins read all"
  on public.order_items for select to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
    or (select public.is_admin())
  );

create policy "Users read own order timeline; admins read all"
  on public.order_status_history for select to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid()))
    or (select public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create policy "Anyone reads approved reviews; authors read own; admins read all"
  on public.reviews for select to anon, authenticated
  using (
    status = 'approved'
    or user_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "Users review visible products as themselves"
  on public.reviews for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
  );

create policy "Authors edit own reviews; admins moderate"
  on public.reviews for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Authors and admins delete reviews"
  on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Operations
-- ---------------------------------------------------------------------------
create policy "Admins read inventory history"
  on public.inventory_movements for select to authenticated
  using ((select public.is_admin()));

create policy "Anyone reads store settings"
  on public.store_settings for select to anon, authenticated
  using (true);

create policy "Admins update store settings"
  on public.store_settings for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- stripe_events: no policies on purpose → only the service role can access it.
