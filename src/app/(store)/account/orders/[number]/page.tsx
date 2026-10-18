import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Package, Truck } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import {
  AccountPageHeader,
  AccountSectionSkeleton,
} from "@/features/account/components/account-page";
import { buildTimeline, getMyOrder } from "@/features/orders/queries";
import { requireUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { addressLines, readShippingAddress } from "@/lib/orders/address";
import { formatOrderDate, ORDER_STATUS, type OrderStatus } from "@/lib/orders/status";
import { publicStorageUrl } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Order details" };

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default function OrderPage({ params }: PageProps<"/account/orders/[number]">) {
  return (
    <Suspense fallback={<AccountSectionSkeleton />}>
      <OrderDetails params={params} />
    </Suspense>
  );
}

async function OrderDetails({ params }: Pick<PageProps<"/account/orders/[number]">, "params">) {
  const { number } = await params;
  await requireUser(`/account/orders/${number}`);
  const order = await getMyOrder(decodeURIComponent(number));
  if (!order || order.status === "pending_payment") notFound();

  const status = order.status as OrderStatus;
  const address = addressLines(readShippingAddress(order.shipping_address));
  const cancelled = status === "cancelled" || status === "refunded";
  const timeline = buildTimeline(status, order.history);

  return (
    <>
      <AccountPageHeader
        title={`Order ${order.order_number}`}
        description={`Placed ${formatOrderDate(order.created_at)}`}
        actions={<Badge tone={ORDER_STATUS[status].tone}>{ORDER_STATUS[status].label}</Badge>}
      />

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="font-sans text-sm font-medium">Tracking</h2>
          {cancelled ? (
            <p className="mt-3 text-sm text-ink-muted">
              This order was {status === "refunded" ? "refunded" : "cancelled"}
              {order.cancelled_at ? ` on ${formatOrderDate(order.cancelled_at)}` : ""}.
            </p>
          ) : (
            <ol className="mt-6 grid gap-6 sm:grid-cols-4 sm:gap-2">
              {timeline.map((step, index) => (
                <li
                  key={step.status}
                  className="relative flex gap-3 sm:flex-col sm:items-center sm:text-center"
                >
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-4 right-1/2 hidden h-0.5 w-full sm:block",
                        step.done ? "bg-ink" : "bg-line",
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs",
                      step.done
                        ? "border-ink bg-ink text-canvas"
                        : "border-line-strong bg-surface text-ink-faint",
                    )}
                  >
                    {step.done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                  </span>
                  <span className="text-sm">
                    <span className={cn("block font-medium", !step.done && "text-ink-muted")}>
                      {ORDER_STATUS[step.status].label}
                    </span>
                    <span className="block text-xs text-ink-muted">
                      {step.at
                        ? dateTime.format(new Date(step.at))
                        : step.done
                          ? "Done"
                          : "Pending"}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
          {order.tracking_number && (
            <p className="mt-6 flex items-center gap-2 rounded-md bg-subtle p-3 text-sm">
              <Truck className="size-4 text-accent" aria-hidden="true" />
              {order.tracking_carrier ?? "Carrier"} tracking number{" "}
              <span className="font-mono font-medium">{order.tracking_number}</span>
            </p>
          )}
        </Card>

        <Card>
          <ul className="divide-y divide-line">
            {order.items.map((item) => {
              const url = publicStorageUrl("product-images", item.image_path);
              const slug = (item.product as { slug: string } | null)?.slug;
              return (
                <li key={item.id} className="flex items-center gap-4 p-4 text-sm">
                  <span className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded bg-subtle">
                    {url ? (
                      <Image src={url} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <Package className="m-auto size-4 h-full text-ink-faint" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    {slug ? (
                      <Link
                        href={`/products/${slug}`}
                        className="block font-medium hover:underline"
                      >
                        {item.product_name}
                      </Link>
                    ) : (
                      <span className="block font-medium">{item.product_name}</span>
                    )}
                    <span className="text-xs text-ink-muted">
                      {item.variant_title ? `${item.variant_title} · ` : ""}
                      {formatMoney(item.unit_price_cents)} × {item.quantity}
                    </span>
                    {slug && status === "delivered" && (
                      <Link
                        href={`/products/${slug}#write-review`}
                        className="mt-1 block text-xs text-accent-strong underline underline-offset-4"
                      >
                        Write a review
                      </Link>
                    )}
                  </span>
                  <span className="tabular-nums">{formatMoney(item.line_total_cents)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="space-y-2 border-t border-line p-5 text-sm">
            <Line label="Subtotal" value={formatMoney(order.subtotal_cents)} />
            {order.discount_cents > 0 && (
              <Line
                label={`Discount${order.discount_code ? ` (${order.discount_code})` : ""}`}
                value={`−${formatMoney(order.discount_cents)}`}
              />
            )}
            <Line
              label="Shipping"
              value={order.shipping_cents === 0 ? "Free" : formatMoney(order.shipping_cents)}
            />
            {order.tax_cents > 0 && <Line label="Tax" value={formatMoney(order.tax_cents)} />}
            <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(order.total_cents, order.currency)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6 text-sm">
          <h2 className="font-sans font-medium">Delivery address</h2>
          <p className="mt-2 leading-relaxed text-ink-muted">
            {address.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </Card>
      </div>
    </>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
