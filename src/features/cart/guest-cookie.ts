/**
 * Guest carts live in an httpOnly cookie ("variantId:qty,variantId:qty"), so
 * the server can render them like signed-in carts and merge them on login.
 * Parsing is strict: malformed entries are dropped instead of trusted.
 */

export const GUEST_CART_COOKIE = "ss_cart";
export const MAX_CART_LINES = 30;
export const MAX_LINE_QUANTITY = 99;

export type CartLine = { variantId: string; quantity: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseGuestCart(raw: string | undefined): CartLine[] {
  if (!raw) return [];
  const lines = new Map<string, number>();
  for (const entry of raw.split(",")) {
    const [rawId, qty] = entry.split(":");
    const variantId = rawId?.toLowerCase();
    const quantity = Number(qty);
    if (!variantId || !UUID.test(variantId) || !Number.isInteger(quantity) || quantity < 1)
      continue;
    lines.set(variantId, Math.min(MAX_LINE_QUANTITY, (lines.get(variantId) ?? 0) + quantity));
    if (lines.size >= MAX_CART_LINES) break;
  }
  return [...lines].map(([variantId, quantity]) => ({ variantId, quantity }));
}

export function serializeGuestCart(lines: CartLine[]): string {
  return lines
    .filter((l) => UUID.test(l.variantId) && l.quantity >= 1)
    .slice(0, MAX_CART_LINES)
    .map((l) => `${l.variantId}:${Math.min(MAX_LINE_QUANTITY, l.quantity)}`)
    .join(",");
}

/** Adds lines from a guest cart into an account cart: quantities add up, capped. */
export function mergeCartLines(account: CartLine[], guest: CartLine[]): CartLine[] {
  const merged = new Map(account.map((l) => [l.variantId, l.quantity]));
  for (const line of guest) {
    merged.set(
      line.variantId,
      Math.min(MAX_LINE_QUANTITY, (merged.get(line.variantId) ?? 0) + line.quantity),
    );
  }
  return [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));
}
