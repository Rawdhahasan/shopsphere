/**
 * Variant selection for the product page. A product has 0–3 options (Color,
 * Size, …) and one variant per buyable combination. These helpers find the
 * variant for a selection and say which choices are available, sold out, or
 * don't exist, so the picker never offers an impossible combination.
 */

export type OptionValue = { id: string; value: string; swatchHex: string | null };
export type ProductOption = { id: string; name: string; values: OptionValue[] };

export type ProductVariant = {
  id: string;
  sku: string;
  title: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  lowStockThreshold: number;
  imageId: string | null;
  optionValueIds: string[];
};

/** optionId → chosen valueId */
export type Selection = Record<string, string>;

export type ChoiceState = "available" | "sold-out" | "unavailable";

export type StockStatus =
  | { kind: "in-stock"; label: string }
  | { kind: "low"; label: string }
  | { kind: "sold-out"; label: string };

function matches(variant: ProductVariant, selection: Selection, options: ProductOption[]) {
  return options.every((option) => {
    const chosen = selection[option.id];
    return chosen !== undefined && variant.optionValueIds.includes(chosen);
  });
}

/** The variant for a complete selection (or the only variant of a product without options). */
export function findVariant(
  variants: ProductVariant[],
  options: ProductOption[],
  selection: Selection,
): ProductVariant | undefined {
  if (options.length === 0) return variants[0];
  return variants.find((variant) => matches(variant, selection, options));
}

/** Starts on the first in-stock variant, falling back to the first variant. */
export function initialSelection(variants: ProductVariant[], options: ProductOption[]): Selection {
  const start = variants.find((v) => v.stock > 0) ?? variants[0];
  if (!start) return {};
  const selection: Selection = {};
  for (const option of options) {
    const value = option.values.find((v) => start.optionValueIds.includes(v.id));
    if (value) selection[option.id] = value.id;
  }
  return selection;
}

/** What happens if the shopper picks `valueId` for `optionId`, keeping their other choices. */
export function choiceState(
  variants: ProductVariant[],
  options: ProductOption[],
  selection: Selection,
  optionId: string,
  valueId: string,
): ChoiceState {
  const variant = findVariant(variants, options, { ...selection, [optionId]: valueId });
  if (!variant) return "unavailable";
  return variant.stock > 0 ? "available" : "sold-out";
}

/**
 * Picks a value, then repairs the other options if that combination doesn't
 * exist: keeps as many of the shopper's choices as possible, preferring stock.
 */
export function selectValue(
  variants: ProductVariant[],
  options: ProductOption[],
  selection: Selection,
  optionId: string,
  valueId: string,
): Selection {
  const next = { ...selection, [optionId]: valueId };
  if (findVariant(variants, options, next)) return next;

  const candidates = variants.filter((v) => v.optionValueIds.includes(valueId));
  const score = (v: ProductVariant) =>
    options.filter((o) => o.id !== optionId && v.optionValueIds.includes(selection[o.id] ?? ""))
      .length *
      2 +
    (v.stock > 0 ? 1 : 0);
  const best = candidates.sort((a, b) => score(b) - score(a))[0];
  if (!best) return next;

  const repaired: Selection = {};
  for (const option of options) {
    const value = option.values.find((v) => best.optionValueIds.includes(v.id));
    if (value) repaired[option.id] = value.id;
  }
  return repaired;
}

export function stockStatus(variant: ProductVariant | undefined): StockStatus {
  if (!variant || variant.stock <= 0) return { kind: "sold-out", label: "Sold out" };
  if (variant.stock <= variant.lowStockThreshold) {
    return { kind: "low", label: `Only ${variant.stock} left` };
  }
  return { kind: "in-stock", label: "In stock" };
}

/** Whole-percent saving for a sale price, e.g. 20 for $80 instead of $100. */
export function savingPercent(priceCents: number, compareAtCents: number | null): number | null {
  if (!compareAtCents || compareAtCents <= priceCents) return null;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}
