"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ShoppingBag, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui";
import { addToCart } from "../actions";

/** Adds the chosen variant to the cart and confirms with a small panel. */
export function AddToCartButton({
  variantId,
  productName,
  quantity,
  soldOut,
}: {
  variantId: string | undefined;
  productName: string;
  quantity: number;
  soldOut: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (added === null) return;
    const timer = setTimeout(() => setAdded(null), 6000);
    return () => clearTimeout(timer);
  }, [added]);

  function add() {
    if (!variantId) return;
    setError(null);
    startTransition(async () => {
      const result = await addToCart(variantId, quantity);
      if (result.ok) setAdded(result.count);
      else setError(result.message);
    });
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full"
        disabled={!variantId || soldOut}
        loading={pending}
        onClick={add}
      >
        {!pending && <ShoppingBag className="size-4" aria-hidden="true" />}
        {soldOut ? "Sold out" : pending ? "Adding…" : "Add to cart"}
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-24 z-50 flex justify-end sm:right-6 sm:left-auto"
      >
        {added !== null && (
          <div className="pointer-events-auto w-full max-w-sm animate-fade-up rounded-lg border border-line bg-surface p-5 shadow-lifted">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                <Check className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Added to your cart</p>
                <p className="mt-0.5 truncate text-sm text-ink-muted">
                  {quantity} × {productName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdded(null)}
                className="rounded-full p-1 text-ink-muted hover:bg-subtle"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href="/cart" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                View cart ({added})
              </Link>
              <Link href="/checkout" className={buttonVariants({ size: "sm" })}>
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
