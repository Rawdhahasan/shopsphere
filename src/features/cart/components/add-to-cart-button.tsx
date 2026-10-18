"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui";

/** Adds the chosen variant to the cart. Wired up to the cart in Phase 5. */
export function AddToCartButton({
  variantId,
  soldOut,
}: {
  variantId: string | undefined;
  productName: string;
  quantity: number;
  soldOut: boolean;
}) {
  return (
    <Button size="lg" className="w-full" disabled={!variantId || soldOut}>
      <ShoppingBag className="size-4" aria-hidden="true" />
      {soldOut ? "Sold out" : "Add to cart"}
    </Button>
  );
}
