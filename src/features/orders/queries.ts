import "server-only";
import type { OrderStatus } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in customer's orders, read with their own client so RLS limits
 * results to their orders. Checkouts that were abandoned before payment are
 * left out: customers only see orders they actually placed.
 */
export async function listMyOrders(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total_cents, currency, created_at, items:order_items(count)")
    .eq("user_id", userId)
    .neq("status", "pending_payment")
    .or("status.neq.cancelled,paid_at.not.is.null")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load your orders: ${error.message}`);
  return data.map((o) => ({
    ...o,
    itemCount: (o.items as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

export type OrderTimelineStep = { status: OrderStatus; at: string | null; done: boolean };

export async function getMyOrder(orderNumber: string) {
  if (!/^SS-\d+$/.test(orderNumber)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, email, currency, subtotal_cents, discount_cents, shipping_cents, tax_cents,
       total_cents, discount_code, shipping_address, tracking_carrier, tracking_number,
       created_at, paid_at, shipped_at, delivered_at, cancelled_at,
       items:order_items(id, product_id, product_name, variant_title, sku, quantity, unit_price_cents, line_total_cents, image_path, product:products(slug)),
       history:order_status_history(status, note, created_at)`,
    )
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load the order: ${error.message}`);
  return data;
}

const FLOW: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

/** The fulfilment steps for the tracking timeline, with when each happened. */
export function buildTimeline(
  status: OrderStatus,
  history: { status: OrderStatus; created_at: string }[],
): OrderTimelineStep[] {
  const reached = FLOW.indexOf(status);
  return FLOW.map((step, index) => {
    const event = [...history].reverse().find((h) => h.status === step);
    // Shipping straight from "paid" skips "processing"; it still counts as done.
    const done = reached >= index;
    return { status: step, at: event?.created_at ?? null, done };
  });
}
