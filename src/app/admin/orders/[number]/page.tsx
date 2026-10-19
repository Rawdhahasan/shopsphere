import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminContent, dateTimeFormat } from "@/components/admin/admin-ui";
import { Badge, Skeleton } from "@/components/ui";
import { advanceOrder, refundOrder } from "@/features/admin/orders/actions";
import { RefundForm, ShipForm, StepButton } from "@/features/admin/orders/order-actions";
import { getAdminOrder } from "@/features/admin/orders/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { addressLines, readShippingAddress } from "@/lib/orders/address";
import { ORDER_STATUS, type OrderStatus } from "@/lib/orders/status";
import { publicStorageUrl } from "@/lib/supabase/storage";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[number]">) {
  if (!(await requireAdmin())) return null;
  return (
    <Suspense fallback={<Skeleton className="m-10 h-96" />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: Pick<PageProps<"/admin/orders/[number]">, "params">) {
  const { number } = await params;
  const order = await getAdminOrder(decodeURIComponent(number));
  if (!order) notFound();
  const status = order.status as OrderStatus;
  const customer = order.customer as { full_name: string | null; email: string } | null;

  return (
    <>
      <AdminPageHeader
        title={`Order ${order.order_number}`}
        description={`Placed ${dateTimeFormat.format(new Date(order.created_at))}`}
        actions={
          <>
            <Badge tone={ORDER_STATUS[status].tone}>{ORDER_STATUS[status].label}</Badge>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> All orders
            </Link>
          </>
        }
      />
      <AdminContent className="grid gap-6 space-y-0 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <AdminCard title="Items">
            <ul className="-my-3 divide-y divide-line">
              {order.items.map((item) => {
                const url = publicStorageUrl("product-images", item.image_path);
                return (
                  <li key={item.id} className="flex items-center gap-4 py-3 text-sm">
                    <span className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded bg-subtle">
                      {url ? (
                        <Image src={url} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <Package
                          className="m-auto size-4 h-full text-ink-faint"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{item.product_name}</span>
                      <span className="text-xs text-ink-muted">
                        {item.variant_title ? `${item.variant_title} · ` : ""}SKU {item.sku}
                      </span>
                    </span>
                    <span className="text-ink-muted tabular-nums">
                      {formatMoney(item.unit_price_cents)} × {item.quantity}
                    </span>
                    <span className="w-24 text-right tabular-nums">
                      {formatMoney(item.line_total_cents)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <Row label="Subtotal" value={formatMoney(order.subtotal_cents)} />
              {order.discount_cents > 0 && (
                <Row
                  label={`Discount${order.discount_code ? ` (${order.discount_code})` : ""}`}
                  value={`−${formatMoney(order.discount_cents)}`}
                />
              )}
              <Row
                label="Shipping"
                value={order.shipping_cents === 0 ? "Free" : formatMoney(order.shipping_cents)}
              />
              {order.tax_cents > 0 && <Row label="Tax" value={formatMoney(order.tax_cents)} />}
              <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatMoney(order.total_cents, order.currency)}</dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title="Fulfilment">
            {status === "paid" && (
              <div className="space-y-6">
                <StepButton
                  action={advanceOrder.bind(null, order.id, "processing")}
                  label="Start processing"
                />
                <div className="border-t border-line pt-5">
                  <ShipForm action={advanceOrder.bind(null, order.id, "shipped")} />
                </div>
              </div>
            )}
            {status === "processing" && (
              <ShipForm action={advanceOrder.bind(null, order.id, "shipped")} />
            )}
            {status === "shipped" && (
              <div className="space-y-4">
                <p className="text-sm text-ink-muted">
                  Shipped with {order.tracking_carrier} ·{" "}
                  <span className="font-mono text-ink">{order.tracking_number}</span>
                </p>
                <StepButton
                  action={advanceOrder.bind(null, order.id, "delivered")}
                  label="Mark as delivered"
                />
              </div>
            )}
            {status === "delivered" && (
              <p className="text-sm text-ink-muted">Delivered. Nothing left to do.</p>
            )}
            {(status === "cancelled" || status === "refunded" || status === "pending_payment") && (
              <p className="text-sm text-ink-muted">
                {status === "pending_payment"
                  ? "Waiting for the customer to pay. Unpaid checkouts are released automatically."
                  : `This order was ${status}.`}
              </p>
            )}
          </AdminCard>

          {(status === "paid" || status === "processing") && (
            <AdminCard title="Refund">
              <RefundForm action={refundOrder.bind(null, order.id)} />
            </AdminCard>
          )}
        </div>

        <div className="space-y-6">
          <AdminCard title="Customer">
            <p className="text-sm font-medium">{customer?.full_name ?? "Guest"}</p>
            <p className="text-sm text-ink-muted">{order.email}</p>
            {order.user_id && (
              <Link
                href={`/admin/customers/${order.user_id}`}
                className="mt-2 inline-block text-sm underline underline-offset-4"
              >
                View customer
              </Link>
            )}
          </AdminCard>
          <AdminCard title="Delivery address">
            <p className="text-sm leading-relaxed text-ink-muted">
              {addressLines(readShippingAddress(order.shipping_address)).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </AdminCard>
          <AdminCard title="Payment">
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-ink-muted">Stripe session</dt>
                <dd className="font-mono break-all">
                  {order.stripe_checkout_session_id ?? "Demo order"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Payment intent</dt>
                <dd className="font-mono break-all">{order.stripe_payment_intent_id ?? "—"}</dd>
              </div>
            </dl>
          </AdminCard>
          <AdminCard title="Timeline">
            <ol className="space-y-3 text-sm">
              {[...order.history]
                .sort((a, b) => a.created_at.localeCompare(b.created_at))
                .map((h) => (
                  <li key={h.id} className="flex justify-between gap-3">
                    <span>{ORDER_STATUS[h.status as OrderStatus].label}</span>
                    <span className="text-xs whitespace-nowrap text-ink-muted">
                      {dateTimeFormat.format(new Date(h.created_at))}
                    </span>
                  </li>
                ))}
            </ol>
          </AdminCard>
        </div>
      </AdminContent>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
