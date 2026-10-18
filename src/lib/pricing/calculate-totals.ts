import { isValidCents } from "@/lib/money";

/**
 * The single source of truth for order totals.
 *
 * It only ever runs on the server, with prices loaded from the database.
 * The browser sends "variant X, quantity 2", never a price, so nobody can
 * pay less by editing a request.
 */

export const MAX_QUANTITY_PER_LINE = 99;

export type PricedLine = {
  unitPriceCents: number;
  quantity: number;
};

export type DiscountRule = {
  type: "percentage" | "fixed_amount";
  /** Whole percent (1–100) for percentage, cents for fixed_amount. */
  value: number;
  minSubtotalCents: number;
};

export type ShippingRule = {
  flatCents: number;
  /** Orders at or above this (after discount) ship free. null = never free. */
  freeThresholdCents: number | null;
};

export type OrderTotals = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
};

export class PricingError extends Error {}

export function calculateOrderTotals(input: {
  lines: PricedLine[];
  discount?: DiscountRule | null;
  shipping: ShippingRule;
  /** Tax rate in basis points: 825 = 8.25%. */
  taxRateBps: number;
}): OrderTotals {
  const { lines, discount, shipping, taxRateBps } = input;

  if (lines.length === 0) throw new PricingError("Cannot price an empty order.");
  for (const line of lines) {
    if (!isValidCents(line.unitPriceCents)) throw new PricingError("Invalid unit price.");
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_QUANTITY_PER_LINE
    ) {
      throw new PricingError("Invalid quantity.");
    }
  }
  if (!Number.isInteger(taxRateBps) || taxRateBps < 0 || taxRateBps > 10_000) {
    throw new PricingError("Invalid tax rate.");
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const discountCents = calculateDiscount(subtotalCents, discount);
  const discountedSubtotal = subtotalCents - discountCents;

  const qualifiesForFreeShipping =
    shipping.freeThresholdCents !== null && discountedSubtotal >= shipping.freeThresholdCents;
  const shippingCents = qualifiesForFreeShipping ? 0 : shipping.flatCents;

  // Tax applies to goods after discount, not to shipping.
  const taxCents = Math.round((discountedSubtotal * taxRateBps) / 10_000);

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    taxCents,
    totalCents: discountedSubtotal + shippingCents + taxCents,
  };
}

export function calculateDiscount(subtotalCents: number, discount?: DiscountRule | null): number {
  if (!discount || subtotalCents < discount.minSubtotalCents) return 0;
  if (discount.type === "percentage") {
    if (discount.value < 1 || discount.value > 100) throw new PricingError("Invalid percentage.");
    return Math.round((subtotalCents * discount.value) / 100);
  }
  if (!isValidCents(discount.value)) throw new PricingError("Invalid discount amount.");
  // A fixed discount can never make the order negative.
  return Math.min(discount.value, subtotalCents);
}
