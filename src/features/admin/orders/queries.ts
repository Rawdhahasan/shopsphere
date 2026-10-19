import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import type { OrderStatus } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_PAGE_SIZE = 20;

export const ORDER_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "paid", label: "Paid (to fulfil)" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
  { value: "pending_payment", label: "Awaiting payment" },
];

const STATUSES = new Set(ORDER_FILTERS.map((f) => f.value).filter(Boolean));

export async function listOrders({ q, status, page }: { q: string; status: string; page: number }) {
  if (!(await requireAdmin())) return null;
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      "id, order_number, email, status, total_cents, currency, created_at, items:order_items(count)",
      { count: "exact" },
    );
  if (STATUSES.has(status)) query = query.eq("status", status as OrderStatus);
  const search = q.replace(/[^A-Za-z0-9@._+-]/g, "").slice(0, 80);
  if (search) query = query.or(`order_number.ilike.%${search}%,email.ilike.%${search}%`);
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error && error.code !== "PGRST103") throw new Error(`Couldn't load orders: ${error.message}`);
  return {
    orders: (data ?? []).map((o) => ({
      ...o,
      itemCount: (o.items as unknown as { count: number }[])[0]?.count ?? 0,
    })),
    total: count ?? 0,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / ADMIN_PAGE_SIZE)),
  };
}

export async function getAdminOrder(orderNumber: string) {
  if (!(await requireAdmin())) return null;
  if (!/^SS-\d+$/.test(orderNumber)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, email, user_id, currency, subtotal_cents, discount_cents, shipping_cents, tax_cents,
       total_cents, discount_code, shipping_address, tracking_carrier, tracking_number,
       stripe_checkout_session_id, stripe_payment_intent_id,
       created_at, paid_at, shipped_at, delivered_at, cancelled_at,
       customer:profiles(full_name, email),
       items:order_items(id, product_name, variant_title, sku, quantity, unit_price_cents, line_total_cents, image_path),
       history:order_status_history(id, status, note, created_at)`,
    )
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load the order: ${error.message}`);
  return data;
}
