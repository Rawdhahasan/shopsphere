"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toggleWishlist } from "../actions";

/** Heart toggle. Guests are sent to sign in and brought back to this page. */
export function WishlistButton({
  productId,
  productName,
  saved,
  returnTo,
}: {
  productId: string;
  productName: string;
  saved: boolean;
  returnTo: string;
}) {
  const [pending, startTransition] = useTransition();
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);

  return (
    <button
      type="button"
      aria-pressed={optimisticSaved}
      aria-label={
        optimisticSaved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`
      }
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimisticSaved(!optimisticSaved);
          await toggleWishlist(productId, returnTo);
        })
      }
      className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-line-strong px-5 text-sm transition-colors hover:border-ink"
    >
      <Heart
        className={cn("size-4.5 transition-colors", optimisticSaved && "fill-accent text-accent")}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      {optimisticSaved ? "Saved" : "Save"}
    </button>
  );
}

export function WishlistButtonPlaceholder() {
  return (
    <span className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-line-strong px-5 text-sm text-ink-muted">
      <Heart className="size-4.5" strokeWidth={1.75} aria-hidden="true" />
      Save
    </span>
  );
}
