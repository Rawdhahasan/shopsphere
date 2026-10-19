import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Boxes, ShoppingCart, Star } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminContent, dateTimeFormat } from "@/components/admin/admin-ui";
import { Badge, Skeleton } from "@/components/ui";
import { getAnalytics } from "@/features/admin/analytics/queries";
import { KpiRow, RevenueCard } from "@/features/admin/analytics/sections";
import { getDashboardAttention } from "@/features/admin/dashboard-stats";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS } from "@/lib/orders/status";

export const metadata = { title: "Dashboard" };

/**
 * Layouts and pages render in parallel, so AdminGate in the layout can't stop
 * this page from running. Every admin page checks the role itself.
 */
export default async function AdminDashboardPage() {
  if (!(await requireAdmin())) return null;
  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="The last 30 days at a glance."
        actions={
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
          >
            Full analytics <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <AdminContent>
        <Suspense fallback={<Skeleton className="h-[36rem] w-full" />}>
          <Dashboard />
        </Suspense>
      </AdminContent>
    </>
  );
}

async function Dashboard() {
  const [analytics, attention] = await Promise.all([getAnalytics(30), getDashboardAttention()]);
  if (!analytics || !attention) return null;
  const items = [
    {
      href: "/admin/orders?status=paid",
      icon: ShoppingCart,
      count: attention.toFulfil,
      label: "orders to fulfil",
    },
    {
      href: "/admin/reviews",
      icon: Star,
      count: attention.pendingReviews,
      label: "reviews waiting for approval",
    },
    {
      href: "/admin/inventory?filter=low",
      icon: Boxes,
      count: attention.lowStockVariants + attention.outOfStockVariants,
      label: `variants low or out of stock (${attention.outOfStockVariants} out)`,
    },
  ];

  return (
    <>
      <KpiRow analytics={analytics} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <RevenueCard analytics={analytics} />
        <AdminCard title="Needs attention">
          <ul className="-my-1 space-y-1">
            {items.map(({ href, icon: Icon, count, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-md p-2 text-sm hover:bg-subtle"
                >
                  <Icon className="size-4 text-ink-muted" aria-hidden="true" />
                  <span className="font-semibold tabular-nums">{count}</span>
                  <span className="flex-1 text-ink-muted">{label}</span>
                  <ArrowRight className="size-4 text-ink-faint" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>
      <AdminCard
        title="Latest orders"
        actions={
          <Link
            href="/admin/orders"
            className="text-sm text-ink-muted underline underline-offset-4"
          >
            All orders
          </Link>
        }
      >
        <ul className="-my-2 divide-y divide-line text-sm">
          {attention.recentOrders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 py-2">
              <Link
                href={`/admin/orders/${o.order_number}`}
                className="w-28 font-medium hover:underline"
              >
                {o.order_number}
              </Link>
              <span className="min-w-0 flex-1 truncate text-ink-muted">{o.email}</span>
              <span className="hidden text-xs text-ink-muted sm:block">
                {dateTimeFormat.format(new Date(o.created_at))}
              </span>
              <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
              <span className="w-24 text-right tabular-nums">{formatMoney(o.total_cents)}</span>
            </li>
          ))}
        </ul>
      </AdminCard>
    </>
  );
}
