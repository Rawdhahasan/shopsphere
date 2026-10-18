import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"] as const;
const DAY_MS = 86_400_000;

export type DashboardStats = {
  revenue30dCents: number;
  orders30d: number;
  customers: number;
  lowStockVariants: number;
};

/**
 * Headline numbers for the admin dashboard. Runs with the admin's own
 * session, so Row-Level Security returns nothing to anyone else.
 */
export async function getDashboardStats(): Promise<DashboardStats | null> {
  if (!(await requireAdmin())) return null;
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * DAY_MS).toISOString();

  const [recentOrders, customers, variants] = await Promise.all([
    supabase
      .from("orders")
      .select("total_cents")
      .in("status", PAID_STATUSES)
      .gte("created_at", since),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase
      .from("product_variants")
      .select("stock_quantity, low_stock_threshold")
      .eq("is_active", true),
  ]);

  return {
    revenue30dCents: (recentOrders.data ?? []).reduce((sum, o) => sum + o.total_cents, 0),
    orders30d: recentOrders.data?.length ?? 0,
    customers: customers.count ?? 0,
    lowStockVariants: (variants.data ?? []).filter((v) => v.stock_quantity <= v.low_stock_threshold)
      .length,
  };
}
