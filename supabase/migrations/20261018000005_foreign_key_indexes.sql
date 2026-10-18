-- =============================================================================
-- ShopSphere · 005 · Foreign-key indexes
-- Postgres doesn't index foreign keys automatically. Without these, deleting a
-- parent row (or joining on these columns) scans the whole child table.
-- =============================================================================

create index product_variants_image_id_idx on public.product_variants (image_id);
create index cart_items_variant_id_idx on public.cart_items (variant_id);
create index orders_discount_code_id_idx on public.orders (discount_code_id);
create index order_status_history_changed_by_idx on public.order_status_history (changed_by);
create index reviews_user_id_idx on public.reviews (user_id);
create index reviews_moderated_by_idx on public.reviews (moderated_by);
create index inventory_movements_order_id_idx on public.inventory_movements (order_id);
create index inventory_movements_created_by_idx on public.inventory_movements (created_by);
