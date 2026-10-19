import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { dayKeys, percentChange, type RangeDays } from "./math";

const SOLD = ["paid", "processing", "shipped", "delivered"] as const;
const DAY_MS = 86_400_000;

type OrderRow = {
  status: string;
  total_cents: number;
  created_at: string;
  items: {
    product_id: string | null;
    product_name: string;
    quantity: number;
    line_total_cents: number;
    product: { slug: string; category: { name: string } | null } | null;
  }[];
};

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>;

/**
 * Sales analytics for the last `days` days, compared with the period before.
 * Only paid orders count as sales; refunds are reported separately.
 */
export async function getAnalytics(days: RangeDays, now = new Date()) {
  if (!(await requireAdmin())) return null;
  const supabase = await createClient();
  const keys = dayKeys(days, now);
  const start = new Date(`${keys[0]}T00:00:00Z`);
  const previousStart = new Date(start.getTime() - days * DAY_MS);

  const { data, error } = await supabase
    .from("orders")
    .select(
      "status, total_cents, created_at, items:order_items(product_id, product_name, quantity, line_total_cents, product:products(slug, category:categories(name)))",
    )
    .in("status", [...SOLD, "refunded"])
    .gte("created_at", previousStart.toISOString());
  if (error) throw new Error(`Couldn't load analytics: ${error.message}`);
  const orders = data as unknown as OrderRow[];

  const inCurrent = (o: OrderRow) => new Date(o.created_at) >= start;
  const sold = (o: OrderRow) => (SOLD as readonly string[]).includes(o.status);
  const current = orders.filter((o) => inCurrent(o) && sold(o));
  const previous = orders.filter((o) => !inCurrent(o) && sold(o));
  const refunded = orders.filter((o) => inCurrent(o) && o.status === "refunded");

  const sum = (list: OrderRow[]) => list.reduce((s, o) => s + o.total_cents, 0);
  const units = (list: OrderRow[]) =>
    list.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0);
  const kpi = (cur: number, prev: number) => ({
    value: cur,
    previous: prev,
    change: percentChange(cur, prev),
  });

  const revenue = sum(current);
  const previousRevenue = sum(previous);
  const aov = current.length ? Math.round(revenue / current.length) : 0;
  const previousAov = previous.length ? Math.round(previousRevenue / previous.length) : 0;

  const byDay = new Map(keys.map((k) => [k, { revenueCents: 0, orders: 0 }]));
  const byCategory = new Map<string, number>();
  const byProduct = new Map<
    string,
    { name: string; slug: string | null; revenueCents: number; units: number }
  >();
  for (const order of current) {
    const day = byDay.get(order.created_at.slice(0, 10));
    if (day) {
      day.revenueCents += order.total_cents;
      day.orders += 1;
    }
    for (const item of order.items) {
      const category = item.product?.category?.name ?? "Other";
      byCategory.set(category, (byCategory.get(category) ?? 0) + item.line_total_cents);
      const key = item.product_id ?? item.product_name;
      const entry = byProduct.get(key) ?? {
        name: item.product_name,
        slug: item.product?.slug ?? null,
        revenueCents: 0,
        units: 0,
      };
      entry.revenueCents += item.line_total_cents;
      entry.units += item.quantity;
      byProduct.set(key, entry);
    }
  }

  return {
    days,
    revenue: kpi(revenue, previousRevenue),
    orders: kpi(current.length, previous.length),
    averageOrder: kpi(aov, previousAov),
    unitsSold: kpi(units(current), units(previous)),
    refunds: { count: refunded.length, cents: sum(refunded) },
    daily: keys.map((date) => ({ date, ...byDay.get(date)! })),
    categories: [...byCategory]
      .map(([name, cents]) => ({ name, cents }))
      .sort((a, b) => b.cents - a.cents),
    topProducts: [...byProduct.values()]
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 8),
  };
}
