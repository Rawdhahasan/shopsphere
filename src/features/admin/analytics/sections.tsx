import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils/cn";
import type { Analytics } from "./queries";
import { RANGES, type RangeDays } from "./math";
import { RevenueChart } from "./revenue-chart";
import { StatTile } from "./figures";

const dayLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function RangePicker({ days, basePath }: { days: RangeDays; basePath: string }) {
  return (
    <nav
      aria-label="Date range"
      className="inline-flex rounded-md border border-line-strong bg-surface p-0.5 text-sm"
    >
      {RANGES.map((range) => (
        <Link
          key={range}
          href={range === 30 ? basePath : `${basePath}?days=${range}`}
          aria-current={days === range ? "page" : undefined}
          className={cn(
            "rounded px-3 py-1.5",
            days === range ? "bg-ink font-medium text-canvas" : "text-ink-muted hover:text-ink",
          )}
        >
          Last {range} days
        </Link>
      ))}
    </nav>
  );
}

export function KpiRow({ analytics }: { analytics: NonNullable<Analytics> }) {
  const period = `previous ${analytics.days} days`;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Revenue"
        value={formatMoney(analytics.revenue.value)}
        change={analytics.revenue.change}
        periodLabel={period}
      />
      <StatTile
        label="Orders"
        value={String(analytics.orders.value)}
        change={analytics.orders.change}
        periodLabel={period}
      />
      <StatTile
        label="Average order"
        value={formatMoney(analytics.averageOrder.value)}
        change={analytics.averageOrder.change}
        periodLabel={period}
      />
      <StatTile
        label="Items sold"
        value={String(analytics.unitsSold.value)}
        change={analytics.unitsSold.change}
        periodLabel={period}
      />
    </div>
  );
}

export function RevenueCard({ analytics }: { analytics: NonNullable<Analytics> }) {
  const total = analytics.revenue.value;
  return (
    <section
      className="rounded-lg border border-line bg-surface p-5"
      aria-labelledby="revenue-heading"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="revenue-heading" className="font-sans text-sm font-medium">
          Revenue per day
        </h2>
        <p className="text-xs text-ink-muted">
          {formatMoney(total)} over the last {analytics.days} days
          {analytics.refunds.count > 0 &&
            ` · ${analytics.refunds.count} refunded (${formatMoney(analytics.refunds.cents)})`}
        </p>
      </div>
      <RevenueChart
        data={analytics.daily}
        label={`Revenue per day over the last ${analytics.days} days, ${formatMoney(total)} in total`}
      />
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">
          Show as a table
        </summary>
        <div className="mt-3 max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-ink-muted">
                <th className="py-1 font-medium">Day</th>
                <th className="py-1 text-right font-medium">Orders</th>
                <th className="py-1 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...analytics.daily].reverse().map((d) => (
                <tr key={d.date} className="border-t border-line">
                  <td className="py-1">{dayLabel.format(new Date(`${d.date}T00:00:00Z`))}</td>
                  <td className="py-1 text-right">{d.orders}</td>
                  <td className="py-1 text-right">{formatMoney(d.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
