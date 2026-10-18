import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Lock, ShoppingBag, TriangleAlert, Truck } from "lucide-react";
import { Alert, buttonVariants, Container, EmptyState, Eyebrow, Skeleton } from "@/components/ui";
import { CartLineControls } from "@/features/cart/components/cart-line-controls";
import { getCart } from "@/features/cart/server";
import { Price } from "@/features/catalog/components/price";
import { getSessionUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { calculateOrderTotals } from "@/lib/pricing/calculate-totals";

export const metadata = { title: "Your cart", robots: { index: false } };

export default function CartPage() {
  return (
    <Container className="py-12 lg:py-16">
      <Eyebrow>Your cart</Eyebrow>
      <h1 className="mt-3 text-4xl font-light sm:text-5xl">Shopping cart</h1>
      <Suspense fallback={<CartSkeleton />}>
        <CartContent />
      </Suspense>
    </Container>
  );
}

async function CartContent() {
  const [cart, user] = await Promise.all([getCart(), getSessionUser()]);

  if (cart.items.length === 0) {
    return (
      <div className="mt-10">
        {cart.removedCount > 0 && (
          <Alert tone="warning" className="mb-6">
            Some items were removed because they’re no longer available.
          </Alert>
        )}
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the collection and add something you love."
          action={
            <Link href="/products" className={buttonVariants()}>
              Start shopping
            </Link>
          }
        />
      </div>
    );
  }

  const totals = calculateOrderTotals({
    lines: cart.items.map((i) => ({ unitPriceCents: i.unitPriceCents, quantity: i.quantity })),
    shipping: {
      flatCents: cart.shipping.flatCents,
      freeThresholdCents: cart.shipping.freeThresholdCents,
    },
    taxRateBps: cart.shipping.taxRateBps,
  });
  const threshold = cart.shipping.freeThresholdCents;
  const toFreeShipping = threshold !== null ? Math.max(0, threshold - totals.subtotalCents) : null;
  const overStock = cart.items.some((i) => i.overStock);

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <section aria-label="Items in your cart">
        {cart.removedCount > 0 && (
          <Alert tone="warning" className="mb-6">
            Some items were removed because they’re no longer available.
          </Alert>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {cart.items.map((item) => (
            <li key={item.variantId} className="flex gap-5 py-6">
              <Link
                href={`/products/${item.productSlug}`}
                className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-md bg-subtle sm:w-28"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <ImageOff className="m-auto size-5 h-full text-ink-faint" aria-hidden="true" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-sans text-[0.95rem] font-medium">
                    <Link href={`/products/${item.productSlug}`} className="hover:underline">
                      {item.productName}
                    </Link>
                  </h2>
                  {item.variantTitle && (
                    <p className="mt-0.5 text-sm text-ink-muted">{item.variantTitle}</p>
                  )}
                  <Price
                    cents={item.unitPriceCents}
                    compareAtCents={item.compareAtCents}
                    className="mt-1 text-sm"
                  />
                  {item.overStock && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                      <TriangleAlert className="size-3.5" aria-hidden="true" />
                      {item.stock === 0
                        ? "Sold out. Remove it to check out."
                        : `Only ${item.stock} left. Lower the quantity to check out.`}
                    </p>
                  )}
                  <div className="mt-4">
                    <CartLineControls
                      variantId={item.variantId}
                      productName={item.productName}
                      quantity={item.quantity}
                      max={Math.max(item.quantity, Math.min(item.stock, 99))}
                    />
                  </div>
                </div>
                <p className="text-sm font-medium tabular-nums sm:text-right">
                  {formatMoney(item.unitPriceCents * item.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/products" className="mt-6 inline-block text-sm underline underline-offset-4">
          Continue shopping
        </Link>
      </section>

      <aside
        aria-label="Order summary"
        className="h-fit rounded-lg border border-line bg-surface p-6 lg:sticky lg:top-28"
      >
        <h2 className="font-sans text-base font-medium">Order summary</h2>

        {toFreeShipping !== null && (
          <div className="mt-5 rounded-md bg-subtle p-4 text-sm">
            <p className="flex items-center gap-2">
              <Truck className="size-4 text-accent" aria-hidden="true" />
              {toFreeShipping > 0 ? (
                <span>
                  You’re <strong className="font-medium">{formatMoney(toFreeShipping)}</strong> away
                  from free shipping
                </span>
              ) : (
                <span>You’ve unlocked free shipping</span>
              )}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{
                  width: `${Math.min(100, (totals.subtotalCents / (threshold || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">
              Subtotal ({cart.count} {cart.count === 1 ? "item" : "items"})
            </dt>
            <dd className="tabular-nums">{formatMoney(totals.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Shipping</dt>
            <dd className="tabular-nums">
              {totals.shippingCents === 0 ? "Free" : formatMoney(totals.shippingCents)}
            </dd>
          </div>
          {totals.taxCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Estimated tax</dt>
              <dd className="tabular-nums">{formatMoney(totals.taxCents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-4 text-base font-medium">
            <dt>Estimated total</dt>
            <dd className="tabular-nums">{formatMoney(totals.totalCents)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-ink-muted">Discount codes can be added at checkout.</p>

        {overStock ? (
          <p className="mt-6 rounded-md bg-warning-soft p-3 text-sm text-warning">
            Some items have less stock than you’ve asked for. Update them to continue.
          </p>
        ) : (
          <Link
            href="/checkout"
            className={buttonVariants({ size: "lg", className: "mt-6 w-full" })}
          >
            <Lock className="size-4" aria-hidden="true" />
            {user ? "Checkout" : "Sign in to check out"}
          </Link>
        )}
        {!user && (
          <p className="mt-3 text-center text-xs text-ink-muted">
            Your cart is saved and moves to your account when you sign in.
          </p>
        )}
      </aside>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]" aria-busy="true">
      <span className="sr-only" role="status">
        Loading your cart…
      </span>
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-5">
            <Skeleton className="aspect-[4/5] w-28" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
