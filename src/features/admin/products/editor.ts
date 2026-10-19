/**
 * Pure helpers for the product editor (no database access, unit-tested).
 */

export const MAX_OPTIONS = 3;
export const MAX_VALUES_PER_OPTION = 20;
export const MAX_VARIANTS = 100;

export type OptionInput = { name: string; values: { value: string; swatch: string | null }[] };

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** "Dimensions: W 80 × D 40 cm" per line → [{ label, value }]. Lines without a colon are skipped. */
export function parseSpecifications(text: string): { label: string; value: string }[] {
  return text
    .split("\n")
    .map((line) => {
      const index = line.indexOf(":");
      if (index <= 0) return null;
      const label = line.slice(0, index).trim().slice(0, 60);
      const value = line
        .slice(index + 1)
        .trim()
        .slice(0, 300);
      return label && value ? { label, value } : null;
    })
    .filter((s): s is { label: string; value: string } => s !== null)
    .slice(0, 20);
}

export function formatSpecifications(specs: { label: string; value: string }[]): string {
  return specs.map((s) => `${s.label}: ${s.value}`).join("\n");
}

export type OptionsParseResult =
  { ok: true; options: OptionInput[] } | { ok: false; error: string };

/**
 * One option per line: "Color: Ivory #EEE8DD, Rust #B25A33" or "Size: S, M, L".
 * A trailing #RRGGBB on a value becomes its colour swatch.
 */
export function parseOptionsText(text: string): OptionsParseResult {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > MAX_OPTIONS)
    return { ok: false, error: `Use at most ${MAX_OPTIONS} options.` };

  const options: OptionInput[] = [];
  for (const line of lines) {
    const index = line.indexOf(":");
    if (index <= 0) return { ok: false, error: `"${line}" needs a name, e.g. "Size: S, M, L".` };
    const name = line.slice(0, index).trim();
    if (name.length > 40) return { ok: false, error: `Option name "${name}" is too long.` };
    if (options.some((o) => o.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: `"${name}" is listed twice.` };
    }
    const values: OptionInput["values"] = [];
    for (const raw of line.slice(index + 1).split(",")) {
      const part = raw.trim();
      if (!part) continue;
      const match = part.match(/^(.*?)\s*(#[0-9a-fA-F]{6})$/);
      const value = (match ? match[1] : part).trim();
      if (!value || value.length > 60)
        return { ok: false, error: `Check the values of "${name}".` };
      if (values.some((v) => v.value.toLowerCase() === value.toLowerCase())) {
        return { ok: false, error: `"${value}" appears twice in "${name}".` };
      }
      values.push({ value, swatch: match ? match[2].toUpperCase() : null });
    }
    if (values.length === 0) return { ok: false, error: `Give "${name}" at least one value.` };
    if (values.length > MAX_VALUES_PER_OPTION) {
      return { ok: false, error: `"${name}" has more than ${MAX_VALUES_PER_OPTION} values.` };
    }
    options.push({ name, values });
  }
  const combos = options.reduce((n, o) => n * o.values.length, 1);
  if (combos > MAX_VARIANTS) {
    return { ok: false, error: `That makes ${combos} variants; the limit is ${MAX_VARIANTS}.` };
  }
  return { ok: true, options };
}

export function formatOptionsText(options: OptionInput[]): string {
  return options
    .map(
      (o) =>
        `${o.name}: ${o.values.map((v) => (v.swatch ? `${v.value} ${v.swatch}` : v.value)).join(", ")}`,
    )
    .join("\n");
}

/** Every combination of one value per option ([[]] when there are no options). */
export function cartesian<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>(
    (combos, list) => combos.flatMap((combo) => list.map((item) => [...combo, item])),
    [[]],
  );
}

/** SKU like "RUG-IVORY-5X8FT": product prefix plus the first letters of each value. */
export function makeSku(prefix: string, values: string[]): string {
  const parts = values.map((v) =>
    v
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "")
      .slice(0, 6),
  );
  return [
    prefix
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8) || "SKU",
    ...parts,
  ]
    .filter(Boolean)
    .join("-")
    .slice(0, 64);
}

export function skuPrefixFromSlug(slug: string): string {
  return slug.replace(/-/g, "").slice(0, 4).toUpperCase() || "SKU";
}
