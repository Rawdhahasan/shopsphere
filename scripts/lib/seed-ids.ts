import { createHash } from "node:crypto";

/**
 * Deterministic UUIDs for seed rows (UUID v5 layout, SHA-1 of a stable key).
 * Re-generating the seed gives every product, variant and image the same id,
 * so the SQL is idempotent and the demo-data script can reference rows by key.
 */
export function seedId(kind: string, key: string): string {
  const hex = createHash("sha1").update(`shopsphere:${kind}:${key}`).digest("hex");
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `5${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

/** Storage path of a product's nth image inside the `product-images` bucket. */
export const productImagePath = (slug: string, index: number) =>
  `products/${slug}/${index + 1}.webp`;

/** Storage path of a category's image inside the `category-images` bucket. */
export const categoryImagePath = (slug: string) => `categories/${slug}.webp`;

/** Variant title shown to shoppers, e.g. "Oat Bouclé / Natural Oak". */
export const variantTitle = (options?: Record<string, string>) =>
  options && Object.keys(options).length > 0 ? Object.values(options).join(" / ") : "Default";

/** SKU from the product prefix and option values, e.g. "ARD-OATBOU-NATOAK". */
export function variantSku(prefix: string, options?: Record<string, string>): string {
  if (!options || Object.keys(options).length === 0) return prefix;
  const parts = Object.values(options).map((value) =>
    value
      .normalize("NFD")
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.slice(0, 3))
      .join("")
      .toUpperCase(),
  );
  return [prefix, ...parts].join("-");
}
