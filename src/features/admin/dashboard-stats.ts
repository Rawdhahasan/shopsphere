import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type DashboardAttention = {
  toFulfil: number;
  pendingReviews: number;
  lowStockVariants: number;
  outOfStockVariants: number;
  recentOrders: {
    id: string;
    order_number: string;
    email: string;
    status:
      | "pending_payment"
      | "paid"
      | "processing"
      | "shipped"
      | "delivered"
      | "cancelled"
      | "refunded";
    total_cents: number;
    created_at: string;
  }[];
};

/**
 * What needs an admin's attention right now. Runs with the admin's own
 * session, so Row-Level Security returns nothing to anyone else.
 */
export async function getDashboardAttention(): Promise<DashboardAttention | null> {
  if (!(await requireAdmin())) return null;
  const supabase = await createClient();
  const [toFulfil, pendingReviews, variants, recent] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["paid", "processing"]),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("product_variants")
      .select("stock_quantity, low_stock_threshold, product:products!inner(status)")
      .eq("is_active", true)
      .eq("product.status", "active"),
    supabase
      .from("orders")
      .select("id, order_number, email, status, total_cents, created_at")
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  const rows = variants.data ?? [];
  return {
    toFulfil: toFulfil.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0,
    lowStockVariants: rows.filter(
      (v) => v.stock_quantity > 0 && v.stock_quantity <= v.low_stock_threshold,
    ).length,
    outOfStockVariants: rows.filter((v) => v.stock_quantity === 0).length,
    recentOrders: recent.data ?? [],
  };
}
