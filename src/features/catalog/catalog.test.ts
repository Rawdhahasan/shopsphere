import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, filtersToQuery, parseFilters, sanitizeQuery } from "./filters";
import {
  choiceState,
  findVariant,
  initialSelection,
  savingPercent,
  selectValue,
  stockStatus,
  type ProductOption,
  type ProductVariant,
} from "./variants";

describe("catalog filters", () => {
  it("parses valid URL params", () => {
    expect(
      parseFilters({
        q: "linen",
        category: "bedroom",
        price: "50-150",
        in_stock: "1",
        on_sale: "1",
        sort: "price-asc",
        page: "2",
      }),
    ).toEqual({
      q: "linen",
      category: "bedroom",
      price: "50-150",
      inStock: true,
      onSale: true,
      sort: "price-asc",
      page: 2,
    });
  });

  it("falls back to defaults for anything unexpected", () => {
    expect(
      parseFilters({ sort: "cheapest", price: "free", page: "-3", category: "Bad Slug!", q: "" }),
    ).toEqual(DEFAULT_FILTERS);
    expect(parseFilters({ page: "abc" }).page).toBe(1);
  });

  it("strips characters that could break a database filter", () => {
    expect(sanitizeQuery('oak),name.eq."x" chair')).toBe("oak name eq x chair");
    expect(sanitizeQuery("  café   lamp ")).toBe("café lamp");
    expect(sanitizeQuery("x".repeat(200))).toHaveLength(80);
  });

  it("lets the route fix the category", () => {
    expect(parseFilters({ category: "decor" }, { category: "living" }).category).toBe("living");
  });

  it("round-trips through the query string, leaving out defaults", () => {
    const filters = parseFilters({ q: "vase", on_sale: "1", sort: "newest", page: "3" });
    expect(filtersToQuery(filters)).toBe("?q=vase&on_sale=1&sort=newest&page=3");
    expect(filtersToQuery(DEFAULT_FILTERS)).toBe("");
    expect(filtersToQuery({ ...DEFAULT_FILTERS, category: "bath" }, { omitCategory: true })).toBe(
      "",
    );
  });
});

const base = { iron: "v-iron", brass: "v-brass", small: "v-small", large: "v-large" };
const options: ProductOption[] = [
  {
    id: "finish",
    name: "Finish",
    values: [
      { id: base.iron, value: "Iron", swatchHex: "#333333" },
      { id: base.brass, value: "Brass", swatchHex: "#B08D57" },
    ],
  },
  {
    id: "size",
    name: "Size",
    values: [
      { id: base.small, value: "Small", swatchHex: null },
      { id: base.large, value: "Large", swatchHex: null },
    ],
  },
];

const variant = (id: string, values: string[], stock: number, price = 10_000): ProductVariant => ({
  id,
  sku: id.toUpperCase(),
  title: id,
  priceCents: price,
  compareAtCents: null,
  stock,
  lowStockThreshold: 3,
  imageId: null,
  optionValueIds: values,
});

// Iron/Small sold out, Iron/Large in stock, Brass/Small in stock, Brass/Large doesn't exist.
const variants = [
  variant("iron-small", [base.iron, base.small], 0),
  variant("iron-large", [base.iron, base.large], 8, 14_000),
  variant("brass-small", [base.brass, base.small], 2, 12_000),
];

describe("variant selection", () => {
  it("starts on the first variant that is in stock", () => {
    expect(initialSelection(variants, options)).toEqual({ finish: base.iron, size: base.large });
  });

  it("finds the variant for a full selection", () => {
    expect(findVariant(variants, options, { finish: base.brass, size: base.small })?.id).toBe(
      "brass-small",
    );
    expect(findVariant(variants, options, { finish: base.brass })).toBeUndefined();
  });

  it("uses the single variant of a product without options", () => {
    const single = [variant("default", [], 4)];
    expect(findVariant(single, [], {})?.id).toBe("default");
    expect(initialSelection(single, [])).toEqual({});
  });

  it("marks choices as available, sold out or nonexistent", () => {
    const selection = { finish: base.iron, size: base.large };
    expect(choiceState(variants, options, selection, "size", base.small)).toBe("sold-out");
    expect(choiceState(variants, options, selection, "finish", base.brass)).toBe("unavailable");
    expect(
      choiceState(variants, options, { finish: base.brass, size: base.small }, "finish", base.iron),
    ).toBe("sold-out");
  });

  it("repairs the other options when a choice has no matching combination", () => {
    // Brass only comes in Small, so picking Brass while Large is selected switches size.
    expect(
      selectValue(variants, options, { finish: base.iron, size: base.large }, "finish", base.brass),
    ).toEqual({ finish: base.brass, size: base.small });
    // A valid combination is kept as-is.
    expect(
      selectValue(variants, options, { finish: base.iron, size: base.large }, "size", base.small),
    ).toEqual({ finish: base.iron, size: base.small });
  });

  it("describes stock levels", () => {
    expect(stockStatus(variants[0])).toEqual({ kind: "sold-out", label: "Sold out" });
    expect(stockStatus(variants[2])).toEqual({ kind: "low", label: "Only 2 left" });
    expect(stockStatus(variants[1])).toEqual({ kind: "in-stock", label: "In stock" });
    expect(stockStatus(undefined).kind).toBe("sold-out");
  });

  it("calculates the sale saving", () => {
    expect(savingPercent(8_000, 10_000)).toBe(20);
    expect(savingPercent(8_000, null)).toBeNull();
    expect(savingPercent(8_000, 8_000)).toBeNull();
  });
});
