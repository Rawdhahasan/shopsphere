import { describe, expect, it } from "vitest";
import { MAX_CART_LINES, mergeCartLines, parseGuestCart, serializeGuestCart } from "./guest-cookie";

const a = "8b349d0a-3ab7-51db-a3f7-31411c833c14";
const b = "61a6b940-265f-546f-8cf2-6e4b12d5dfa3";

describe("guest cart cookie", () => {
  it("round-trips lines", () => {
    const lines = [
      { variantId: a, quantity: 2 },
      { variantId: b, quantity: 1 },
    ];
    expect(parseGuestCart(serializeGuestCart(lines))).toEqual(lines);
  });

  it("drops tampered or malformed entries", () => {
    expect(parseGuestCart(`${a}:2,not-a-uuid:3,${b}:-1,${b}:1.5,${b}:x,;drop table`)).toEqual([
      { variantId: a, quantity: 2 },
    ]);
    expect(parseGuestCart(undefined)).toEqual([]);
    expect(parseGuestCart("")).toEqual([]);
  });

  it("adds up duplicates (case-insensitive) and caps quantities at 99", () => {
    expect(parseGuestCart(`${a}:60,${a.toUpperCase()}:60`)).toEqual([
      { variantId: a, quantity: 99 },
    ]);
  });

  it("limits the number of lines", () => {
    const many = Array.from({ length: 40 }, (_, i) => {
      const id = `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
      return `${id}:1`;
    }).join(",");
    expect(parseGuestCart(many)).toHaveLength(MAX_CART_LINES);
  });

  it("merges a guest cart into an account cart on sign-in", () => {
    expect(
      mergeCartLines(
        [{ variantId: a, quantity: 1 }],
        [
          { variantId: a, quantity: 2 },
          { variantId: b, quantity: 98 },
        ],
      ),
    ).toEqual([
      { variantId: a, quantity: 3 },
      { variantId: b, quantity: 98 },
    ]);
    expect(
      mergeCartLines([{ variantId: a, quantity: 90 }], [{ variantId: a, quantity: 20 }]),
    ).toEqual([{ variantId: a, quantity: 99 }]);
  });
});
