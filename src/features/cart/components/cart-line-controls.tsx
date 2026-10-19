"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { Spinner } from "@/components/ui";
import { removeFromCart, updateCartQuantity } from "../actions";

/** Quantity stepper and remove button for one cart line. */
export function CartLineControls({
  variantId,
  productName,
  quantity,
  max,
}: {
  variantId: string;
  productName: string;
  quantity: number;
  max: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => ReturnType<typeof updateCartQuantity>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 items-center rounded-full border border-line-strong"
          aria-busy={pending || undefined}
        >
          <button
            type="button"
            onClick={() => run(() => updateCartQuantity(variantId, quantity - 1))}
            disabled={pending || quantity <= 1}
            className="flex size-9 items-center justify-center rounded-full disabled:opacity-30"
            aria-label={`Decrease quantity of ${productName}`}
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-7 text-center text-sm tabular-nums">
            {pending ? <Spinner className="mx-auto size-3.5" /> : quantity}
            <span className="sr-only"> in cart</span>
          </span>
          <button
            type="button"
            onClick={() => run(() => updateCartQuantity(variantId, quantity + 1))}
            disabled={pending || quantity >= max}
            className="flex size-9 items-center justify-center rounded-full disabled:opacity-30"
            aria-label={`Increase quantity of ${productName}`}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => run(() => removeFromCart(variantId))}
          disabled={pending}
          className="text-xs text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          Remove<span className="sr-only"> {productName}</span>
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
