import { describe, expect, it } from "vitest";
import { calculateOrderTotals, PricingError } from "./calculate-totals";

const shipping = { flatCents: 1000, freeThresholdCents: 15000 };

describe("calculateOrderTotals", () => {
  it("sums line items and adds flat shipping below the free threshold", () => {
    const totals = calculateOrderTotals({
      lines: [
        { unitPriceCents: 2500, quantity: 2 },
        { unitPriceCents: 1999, quantity: 1 },
      ],
      shipping,
      taxRateBps: 0,
    });
    expect(totals).toEqual({
      subtotalCents: 6999,
      discountCents: 0,
      shippingCents: 1000,
      taxCents: 0,
      totalCents: 7999,
    });
  });

  it("ships free at or above the threshold", () => {
    const totals = calculateOrderTotals({
      lines: [{ unitPriceCents: 15000, quantity: 1 }],
      shipping,
      taxRateBps: 0,
    });
    expect(totals.shippingCents).toBe(0);
  });

  it("checks the free-shipping threshold after the discount", () => {
    const totals = calculateOrderTotals({
      lines: [{ unitPriceCents: 16000, quantity: 1 }],
      discount: { type: "percentage", value: 10, minSubtotalCents: 0 },
      shipping,
      taxRateBps: 0,
    });
    expect(totals.discountCents).toBe(1600);
    expect(totals.shippingCents).toBe(1000);
    expect(totals.totalCents).toBe(15400);
  });

  it("taxes the discounted goods but not shipping", () => {
    const totals = calculateOrderTotals({
      lines: [{ unitPriceCents: 10000, quantity: 1 }],
      discount: { type: "fixed_amount", value: 2000, minSubtotalCents: 0 },
      shipping,
      taxRateBps: 825,
    });
    expect(totals.taxCents).toBe(660);
    expect(totals.totalCents).toBe(8000 + 1000 + 660);
  });

  it("ignores a discount when the minimum subtotal isn't met", () => {
    const totals = calculateOrderTotals({
      lines: [{ unitPriceCents: 4000, quantity: 1 }],
      discount: { type: "percentage", value: 20, minSubtotalCents: 5000 },
      shipping,
      taxRateBps: 0,
    });
    expect(totals.discountCents).toBe(0);
  });

  it("never lets a fixed discount push the total below zero", () => {
    const totals = calculateOrderTotals({
      lines: [{ unitPriceCents: 500, quantity: 1 }],
      discount: { type: "fixed_amount", value: 5000, minSubtotalCents: 0 },
      shipping: { flatCents: 0, freeThresholdCents: null },
      taxRateBps: 0,
    });
    expect(totals.discountCents).toBe(500);
    expect(totals.totalCents).toBe(0);
  });

  it.each([
    [{ unitPriceCents: 10.5, quantity: 1 }],
    [{ unitPriceCents: -100, quantity: 1 }],
    [{ unitPriceCents: 100, quantity: 0 }],
    [{ unitPriceCents: 100, quantity: 1.5 }],
    [{ unitPriceCents: 100, quantity: 100 }],
  ])("rejects invalid line %o", (line) => {
    expect(() => calculateOrderTotals({ lines: [line], shipping, taxRateBps: 0 })).toThrow(
      PricingError,
    );
  });

  it("rejects an empty order", () => {
    expect(() => calculateOrderTotals({ lines: [], shipping, taxRateBps: 0 })).toThrow(
      PricingError,
    );
  });
});
