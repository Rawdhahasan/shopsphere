-- Refunds: an admin can refund an order that hasn't shipped yet.
--
-- guard_order_update() only lets admins move orders forward through
-- fulfilment, so refunding (which changes payment state) goes through this
-- function, called by trusted server code after requireAdmin() and, when
-- Stripe is connected, after Stripe confirms the refund.

create function public.refund_order(p_order_id uuid, p_note text default null)
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
  if v_order.id is null or v_order.status not in ('paid', 'processing') then
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
    values (v_item.variant_id, v_item.quantity, 'return', p_order_id,
            coalesce(p_note, 'Refunded ' || v_order.order_number));
  end loop;

  update public.orders
     set status = 'refunded', cancelled_at = coalesce(cancelled_at, now())
   where id = p_order_id;

  -- log_order_status() records the "refunded" step in the order timeline.
  return true;
end;
$$;

revoke execute on function public.refund_order(uuid, text) from public, anon, authenticated;
grant execute on function public.refund_order(uuid, text) to service_role;
