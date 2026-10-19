import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Package } from "lucide-react";
import { buttonVariants, Container, Skeleton } from "@/components/ui";
import { syncCheckoutSession } from "@/features/checkout/orders";
import { requireUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { addressLines, readShippingAddress } from "@/lib/orders/address";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/storage";

export const metadata = { title: "Order confirmed", robots: { index: false } };

export default function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <Container className="max-w-3xl py-12 lg:py-20">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Confirmation searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Confirmation({
  searchParams,
}: Pick<PageProps<"/checkout/success">, "searchParams">) {
  await requireUser("/account/orders");
  const params = await searchParams;
  // Returning from Stripe: confirm the payment with Stripe before showing anything.
  const orderNumber =
    typeof params.session_id === "string"
      ? await syncCheckoutSession(params.session_id)
      : typeof params.order === "string"
        ? params.order
        : null;
  if (!orderNumber || !/^SS-\d+$/.test(orderNumber)) notFound();

  // The shopper's own client: RLS only returns their own order.
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "order_number, status, email, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, discount_code, shipping_address, items:order_items(id, product_name, variant_title, quantity, line_total_cents, image_path)",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order) notFound();

  const paid = order.status !== "pending_payment" && order.status !== "cancelled";
  const address = addressLines(readShippingAddress(order.shipping_address));

  return (
    <div>
      <div className="text-center">
        <span
          className={`mx-auto flex size-14 items-center justify-center rounded-full ${paid ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}
        >
          {paid ? (
            <CheckCircle2 className="size-7" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Clock className="size-7" strokeWidth={1.5} aria-hidden="true" />
          )}
        </span>
        <h1 className="mt-6 text-4xl font-light sm:text-5xl">
          {paid ? "Thank you for your order" : "Confirming your payment…"}
        </h1>
        <p className="mt-4 text-ink-muted">
          {paid ? (
            <>
              Order <span className="font-medium text-ink">{order.order_number}</span> is confirmed.
              We’ll email updates to {order.email}.
            </>
          ) : (
            <>
              Stripe is still processing order {order.order_number}.{" "}
              <Link href={`/checkout/success?order=${order.order_number}`} className="underline">
                Refresh
              </Link>{" "}
              in a moment.
            </>
          )}
        </p>
      </div>

      <div className="mt-12 rounded-lg border border-line bg-surface">
        <ul className="divide-y divide-line">
          {order.items.map((item) => {
            const url = publicStorageUrl("product-images", item.image_path);
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
                  <span className="block font-medium">{item.product_name}</span>
                  <span className="text-xs text-ink-muted">
                    {item.variant_title ? `${item.variant_title} · ` : ""}Qty {item.quantity}
                  </span>
                </span>
                <span className="tabular-nums">{formatMoney(item.line_total_cents)}</span>
              </li>
            );
          })}
        </ul>
        <dl className="space-y-2 border-t border-line p-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(order.subtotal_cents)}</dd>
          </div>
          {order.discount_cents > 0 && (
            <div className="flex justify-between text-success">
              <dt>Discount{order.discount_code ? ` (${order.discount_code})` : ""}</dt>
              <dd className="tabular-nums">−{formatMoney(order.discount_cents)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-muted">Shipping</dt>
            <dd className="tabular-nums">
              {order.shipping_cents === 0 ? "Free" : formatMoney(order.shipping_cents)}
            </dd>
          </div>
          {order.tax_cents > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Tax</dt>
              <dd className="tabular-nums">{formatMoney(order.tax_cents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(order.total_cents)}</dd>
          </div>
        </dl>
        <div className="border-t border-line p-5 text-sm">
          <p className="font-medium">Delivering to</p>
          <p className="mt-1 leading-relaxed text-ink-muted">{address.join(", ")}</p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href={`/account/orders/${order.order_number}`} className={buttonVariants()}>
          Track your order
        </Link>
        <Link href="/products" className={buttonVariants({ variant: "secondary" })}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
