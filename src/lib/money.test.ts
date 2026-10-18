import { describe, expect, it } from "vitest";
import { formatMoney, isValidCents, parseMoneyToCents } from "./money";

describe("formatMoney", () => {
  it("formats whole amounts without decimals", () => {
    expect(formatMoney(15000)).toBe("$150");
  });

  it("formats fractional amounts with two decimals", () => {
    expect(formatMoney(2999)).toBe("$29.99");
    expect(formatMoney(2950)).toBe("$29.50");
  });
});

describe("parseMoneyToCents", () => {
  it.each([
    ["29.99", 2999],
    ["29.9", 2990],
    ["29", 2900],
    [" 0.05 ", 5],
  ])("parses %s", (input, expected) => {
    expect(parseMoneyToCents(input)).toBe(expected);
  });

  it.each(["", "abc", "-5", "1.999", "1,000", "1e3"])("rejects %s", (input) => {
    expect(parseMoneyToCents(input)).toBeNull();
  });
});

describe("isValidCents", () => {
  it("accepts non-negative integers only", () => {
    expect(isValidCents(0)).toBe(true);
    expect(isValidCents(100)).toBe(true);
    expect(isValidCents(-1)).toBe(false);
    expect(isValidCents(1.5)).toBe(false);
    expect(isValidCents("100")).toBe(false);
  });
});
