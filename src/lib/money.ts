/**
 * All money in ShopSphere is stored as integer cents (2999 = $29.99).
 * Whole numbers can't suffer floating-point rounding errors like 0.1 + 0.2.
 */

export const DEFAULT_CURRENCY = "USD";

export function isValidCents(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function formatMoney(cents: number, currency = DEFAULT_CURRENCY, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Parses an admin-entered amount like "29.99" or "29" into cents. Returns null if invalid. */
export function parseMoneyToCents(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}
