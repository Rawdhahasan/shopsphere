import { Suspense } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  AdminContent,
  AdminEmpty,
  AdminFilters,
  AdminTable,
  dateTimeFormat,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import { Badge, Skeleton } from "@/components/ui";
import { listOrders, ORDER_FILTERS } from "@/features/admin/orders/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS } from "@/lib/orders/status";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  if (!(await requireAdmin())) return null;
  return (
    <>
      <AdminPageHeader title="Orders" description="Fulfil, track and refund customer orders." />
      <AdminContent>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <OrdersTable searchParams={searchParams} />
        </Suspense>
      </AdminContent>
    </>
  );
}

async function OrdersTable({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  const result = await listOrders({ q, status, page });
  if (!result) return null;

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminFilters
        action="/admin/orders"
        q={q}
        placeholder="Order number or email"
        filters={[{ name: "status", value: status, options: ORDER_FILTERS }]}
      />
      {result.orders.length === 0 ? (
        <AdminEmpty>No orders match.</AdminEmpty>
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Items</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {result.orders.map((order) => (
              <tr key={order.id} className="hover:bg-subtle/40">
                <Td>
                  <Link
                    href={`/admin/orders/${order.order_number}`}
                    className="font-medium hover:underline"
                  >
                    {order.order_number}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap text-ink-muted">
                  {dateTimeFormat.format(new Date(order.created_at))}
                </Td>
                <Td>{order.email}</Td>
                <Td>{order.itemCount}</Td>
                <Td>
                  <Badge tone={ORDER_STATUS[order.status].tone}>
                    {ORDER_STATUS[order.status].label}
                  </Badge>
                </Td>
                <Td className="text-right tabular-nums">
                  {formatMoney(order.total_cents, order.currency)}
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>
          {result.total} {result.total === 1 ? "order" : "orders"}
        </span>
        {result.pageCount > 1 && (
          <div className="flex gap-1">
            {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={pageHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded",
                  p === page ? "bg-ink text-canvas" : "hover:bg-subtle",
                )}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
