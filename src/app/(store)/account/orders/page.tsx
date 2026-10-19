import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { Badge, buttonVariants, EmptyState } from "@/components/ui";
import {
  AccountPageHeader,
  AccountSectionSkeleton,
} from "@/features/account/components/account-page";
import { listMyOrders } from "@/features/orders/queries";
import { requireUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { formatOrderDate, ORDER_STATUS } from "@/lib/orders/status";

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <>
      <AccountPageHeader title="Orders" description="Track deliveries and see past purchases." />
      <Suspense fallback={<AccountSectionSkeleton />}>
        <OrderList />
      </Suspense>
    </>
  );
}

async function OrderList() {
  const user = await requireUser("/account/orders");
  const orders = await listMyOrders(user.id);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="When you place an order, you can track it here."
        action={
          <Link href="/products" className={buttonVariants({ variant: "secondary" })}>
            Browse products
          </Link>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.order_number}`}
            className="flex flex-wrap items-center gap-4 p-5 transition-colors hover:bg-subtle/50"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{order.order_number}</p>
              <p className="text-sm text-ink-muted">
                {formatOrderDate(order.created_at)} · {order.itemCount}{" "}
                {order.itemCount === 1 ? "item" : "items"}
              </p>
            </div>
            <Badge tone={ORDER_STATUS[order.status].tone}>{ORDER_STATUS[order.status].label}</Badge>
            <span className="w-24 text-right text-sm font-medium tabular-nums">
              {formatMoney(order.total_cents, order.currency)}
            </span>
            <ChevronRight className="size-4 text-ink-faint" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
