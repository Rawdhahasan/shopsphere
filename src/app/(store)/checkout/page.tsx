import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Alert, Container, Eyebrow, Skeleton } from "@/components/ui";
import { placeOrder } from "@/features/checkout/actions";
import { CheckoutView } from "@/features/checkout/components/checkout-view";
import { getCheckoutSummary } from "@/features/checkout/summary";
import { isStripeConfigured } from "@/lib/env/server";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  return (
    <Container className="py-12 lg:py-16">
      <Eyebrow>Secure checkout</Eyebrow>
      <h1 className="mt-3 text-4xl font-light sm:text-5xl">Checkout</h1>
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function CheckoutContent({ searchParams }: Pick<PageProps<"/checkout">, "searchParams">) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : "";
  const summary = await getCheckoutSummary(code);
  const { cart, totals, discount } = summary;

  if (!totals || cart.items.length === 0) redirect("/cart");
  if (cart.items.some((i) => i.overStock)) redirect("/cart");

  const discountLabel = discount
    ? `${discount.code} applied${discount.description ? `: ${discount.description}` : ""} (−${formatMoney(totals.discountCents)})`
    : null;

  return (
    <>
      {params.cancelled === "1" && (
        <Alert tone="info" className="mt-8">
          Payment cancelled. Nothing was charged, and your items are still in your cart.
        </Alert>
      )}
      <CheckoutView
        action={placeOrder}
        email={summary.user.email}
        addresses={summary.addresses}
        items={cart.items.map((i) => ({
          variantId: i.variantId,
          productName: i.productName,
          variantTitle: i.variantTitle,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
          imageUrl: i.imageUrl,
          imageAlt: i.imageAlt,
        }))}
        totals={totals}
        code={discount ? discount.code : ""}
        discountLabel={discountLabel}
        discountError={summary.discountError}
        stripe={isStripeConfigured()}
      />
    </>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_24rem]" aria-busy="true">
      <span className="sr-only" role="status">
        Loading checkout…
      </span>
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
