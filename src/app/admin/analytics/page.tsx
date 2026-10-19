import { Suspense } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminContent } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";
import { BarList } from "@/features/admin/analytics/figures";
import { parseRange } from "@/features/admin/analytics/math";
import { getAnalytics } from "@/features/admin/analytics/queries";
import { KpiRow, RangePicker, RevenueCard } from "@/features/admin/analytics/sections";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  if (!(await requireAdmin())) return null;
  return (
    <>
      <AdminPageHeader
        title="Analytics"
        description="Sales from paid orders. Refunds are listed separately."
      />
      <AdminContent>
        <Suspense fallback={<Skeleton className="h-[40rem] w-full" />}>
          <AnalyticsContent searchParams={searchParams} />
        </Suspense>
      </AdminContent>
    </>
  );
}

async function AnalyticsContent({
  searchParams,
}: Pick<PageProps<"/admin/analytics">, "searchParams">) {
  const { days: raw } = await searchParams;
  const days = parseRange(raw);
  const analytics = await getAnalytics(days);
  if (!analytics) return null;
  const maxProduct = Math.max(1, ...analytics.topProducts.map((p) => p.revenueCents));

  return (
    <>
      <RangePicker days={days} basePath="/admin/analytics" />
      <KpiRow analytics={analytics} />
      <RevenueCard analytics={analytics} />
      <div className="grid gap-6 xl:grid-cols-2">
        <AdminCard title="Sales by room">
          <BarList
            rows={analytics.categories.map((c) => ({ label: c.name, cents: c.cents }))}
            emptyText="No sales in this period."
          />
        </AdminCard>
        <AdminCard title="Top products">
          {analytics.topProducts.length === 0 ? (
            <p className="text-sm text-ink-muted">No sales in this period.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-ink-muted">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 text-right font-medium">Sold</th>
                  <th className="pb-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topProducts.map((p) => (
                  <tr key={p.name} className="border-t border-line">
                    <td className="py-2 pr-3">
                      {p.slug ? (
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          className="hover:underline"
                        >
                          {p.name}
                        </Link>
                      ) : (
                        p.name
                      )}
                      <span
                        className="mt-1 block h-1 rounded-r bg-chart"
                        style={{ width: `max(2px, ${(p.revenueCents / maxProduct) * 100}%)` }}
                        aria-hidden="true"
                      />
                    </td>
                    <td className="py-2 text-right tabular-nums">{p.units}</td>
                    <td className="py-2 text-right tabular-nums">{formatMoney(p.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminCard>
      </div>
    </>
  );
}
