/**
 * Generates supabase/seed.sql and docs/IMAGE_CREDITS.md from supabase/seed/catalog.ts.
 *
 *   npm run db:seed:generate
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  brand,
  categories,
  discountCodes,
  products,
  storeSettings,
  type Photo,
} from "../supabase/seed/catalog";
import {
  categoryImagePath,
  productImagePath,
  seedId,
  variantSku,
  variantTitle,
} from "./lib/seed-ids";

const root = join(import.meta.dirname, "..");

const q = (value: string | null | undefined) =>
  value === null || value === undefined ? "null" : `'${value.replace(/'/g, "''")}'`;
const n = (value: number | null | undefined) =>
  value === null || value === undefined ? "null" : String(value);
const json = (value: unknown) => `${q(JSON.stringify(value))}::jsonb`;

function insert(table: string, columns: string[], rows: string[][], conflict = "(id)") {
  if (rows.length === 0) return "";
  const values = rows.map((row) => `  (${row.join(", ")})`).join(",\n");
  return `insert into public.${table} (${columns.join(", ")}) values\n${values}\non conflict ${conflict} do nothing;\n`;
}

// Stagger publish dates so "newest" sorting has something to sort.
const publishedAt = (index: number) =>
  new Date(Date.UTC(2026, 9, 1) - index * 86_400_000 * 3).toISOString();

const categoryRows: string[][] = [];
const productRows: string[][] = [];
const imageRows: string[][] = [];
const optionRows: string[][] = [];
const valueRows: string[][] = [];
const variantRows: string[][] = [];
const variantOptionRows: string[][] = [];
const movementRows: string[][] = [];

categories.forEach((category, index) => {
  categoryRows.push([
    q(seedId("category", category.slug)),
    q(category.name),
    q(category.slug),
    q(category.description),
    q(categoryImagePath(category.slug)),
    n(index),
  ]);
});

const skus = new Set<string>();

products.forEach((product, productIndex) => {
  const productId = seedId("product", product.slug);
  const status = product.status ?? "active";
  if (!categories.some((c) => c.slug === product.category)) {
    throw new Error(`${product.slug}: unknown category ${product.category}`);
  }

  productRows.push([
    q(productId),
    q(seedId("category", product.category)),
    q(product.name),
    q(product.slug),
    q(product.shortDescription),
    q(product.description),
    q(brand),
    json(product.specifications),
    `'${status}'`,
    String(Boolean(product.featured)),
    status === "active" ? q(publishedAt(productIndex)) : "null",
  ]);

  const imageIds = product.images.map((image, imageIndex) => {
    const id = seedId("product-image", `${product.slug}:${imageIndex}`);
    imageRows.push([
      q(id),
      q(productId),
      q(productImagePath(product.slug, imageIndex)),
      q(image.alt),
      n(imageIndex),
    ]);
    return id;
  });

  const valueIds = new Map<string, string>();
  product.options?.forEach((option, optionIndex) => {
    const optionId = seedId("option", `${product.slug}:${option.name}`);
    optionRows.push([q(optionId), q(productId), q(option.name), n(optionIndex)]);
    option.values.forEach((value, valueIndex) => {
      const valueId = seedId("option-value", `${product.slug}:${option.name}:${value.value}`);
      valueIds.set(`${option.name}=${value.value}`, valueId);
      valueRows.push([q(valueId), q(optionId), q(value.value), q(value.swatch), n(valueIndex)]);
    });
  });

  const optionNames = (product.options ?? []).map((o) => o.name);
  product.variants.forEach((variant, variantIndex) => {
    const keys = Object.keys(variant.options ?? {});
    if (keys.length !== optionNames.length || !optionNames.every((name) => keys.includes(name))) {
      throw new Error(
        `${product.slug}: variant ${variantIndex} must set exactly ${optionNames.join(", ") || "no options"}`,
      );
    }
    const sku = variantSku(product.skuPrefix, variant.options);
    if (skus.has(sku)) throw new Error(`Duplicate SKU ${sku}`);
    skus.add(sku);

    const variantId = seedId("variant", sku);
    variantRows.push([
      q(variantId),
      q(productId),
      q(sku),
      q(variantTitle(variant.options)),
      n(variant.priceCents),
      n(variant.compareAtCents),
      n(variant.stock),
      variant.image === undefined ? "null" : q(imageIds[variant.image]),
      n(variantIndex),
    ]);

    for (const [name, value] of Object.entries(variant.options ?? {})) {
      const valueId = valueIds.get(`${name}=${value}`);
      if (!valueId)
        throw new Error(`${product.slug}: "${name}: ${value}" is not a defined option value`);
      variantOptionRows.push([q(variantId), q(valueId)]);
    }

    if (variant.stock > 0) {
      movementRows.push([
        q(seedId("inventory", sku)),
        q(variantId),
        n(variant.stock),
        "'initial'",
        q("Opening stock from seed data"),
      ]);
    }
  });
});

const discountRows = discountCodes.map((code) => {
  const c = code as typeof code & {
    startsAt?: string;
    endsAt?: string;
    maxRedemptions?: number;
    redemptionCount?: number;
  };
  return [
    q(seedId("discount", c.code)),
    q(c.code),
    q(c.description),
    `'${c.type}'`,
    n(c.value),
    n(c.minSubtotalCents),
    n(c.maxRedemptions),
    n(c.redemptionCount ?? 0),
    q(c.startsAt),
    q(c.endsAt),
  ];
});

const sql = `-- =============================================================================
-- ShopSphere development seed data
-- GENERATED by scripts/generate-seed.ts from supabase/seed/catalog.ts.
-- Do not edit by hand: change the catalog and run \`npm run db:seed:generate\`.
--
-- Safe to run more than once (fixed ids + "on conflict do nothing").
-- Images are uploaded separately by \`npm run db:seed:images\`.
-- =============================================================================

begin;

update public.store_settings
set store_name = ${q(storeSettings.storeName)},
    support_email = ${q(storeSettings.supportEmail)},
    announcement_text = ${q(storeSettings.announcement)}
-- Only fills in a fresh store: settings already changed in the admin are kept.
where id = 1 and support_email is null;

${insert("categories", ["id", "name", "slug", "description", "image_path", "sort_order"], categoryRows)}
${insert(
  "products",
  [
    "id",
    "category_id",
    "name",
    "slug",
    "short_description",
    "description",
    "brand",
    "specifications",
    "status",
    "is_featured",
    "published_at",
  ],
  productRows,
)}
${insert("product_images", ["id", "product_id", "storage_path", "alt_text", "position"], imageRows)}
${insert("product_options", ["id", "product_id", "name", "position"], optionRows)}
${insert("product_option_values", ["id", "option_id", "value", "swatch_hex", "position"], valueRows)}
${insert(
  "product_variants",
  [
    "id",
    "product_id",
    "sku",
    "title",
    "price_cents",
    "compare_at_price_cents",
    "stock_quantity",
    "image_id",
    "position",
  ],
  variantRows,
)}
${insert("product_variant_options", ["variant_id", "option_value_id"], variantOptionRows, "(variant_id, option_value_id)")}
${insert("inventory_movements", ["id", "variant_id", "quantity_change", "reason", "note"], movementRows)}
${insert(
  "discount_codes",
  [
    "id",
    "code",
    "description",
    "type",
    "value",
    "min_subtotal_cents",
    "max_redemptions",
    "redemption_count",
    "starts_at",
    "ends_at",
  ],
  discountRows,
)}
commit;
`;

writeFileSync(join(root, "supabase/seed.sql"), sql);

// ---------------------------------------------------------------------------
// Image credits
// ---------------------------------------------------------------------------
const uses = new Map<string, { photo: Photo; usedFor: string[] }>();
const record = (photo: Photo, usedFor: string) => {
  const entry = uses.get(photo.page) ?? { photo, usedFor: [] };
  entry.usedFor.push(usedFor);
  uses.set(photo.page, entry);
};
categories.forEach((c) => record(c.image, `${c.name} category`));
products.forEach((p) => p.images.forEach((image) => record(image, p.name)));

const creditRows = [...uses.values()]
  .map(
    ({ photo, usedFor }) =>
      `| ${[...new Set(usedFor)].join(", ")} | ${photo.photographer} | [${photo.page}](https://unsplash.com/photos/${photo.page}) |`,
  )
  .join("\n");

writeFileSync(
  join(root, "docs/IMAGE_CREDITS.md"),
  `# Image credits

<!-- GENERATED by scripts/generate-seed.ts. Edit supabase/seed/catalog.ts instead. -->

All product and category photography in ShopSphere's development data comes from
[Unsplash](https://unsplash.com) and is used under the
[Unsplash License](https://unsplash.com/license). It is free to use, including commercially,
without permission or attribution, though we credit every photographer below.

Every photo was:

- found with Unsplash's free-license filter, and confirmed to be served from
  \`images.unsplash.com\` (free photos), not \`plus.unsplash.com\` (paid Unsplash+)
- checked for visible third-party logos or brand names
- matched to a fictional ShopSphere product. The photos show similar items, not the
  photographers' own products, and product names, descriptions and prices are invented.

| Used for | Photographer | Unsplash photo |
| -------- | ------------ | -------------- |
${creditRows}
`,
);

console.log(
  `Generated seed.sql: ${categoryRows.length} categories, ${productRows.length} products, ${variantRows.length} variants, ${imageRows.length} images, ${discountRows.length} discount codes.`,
);
console.log(`Generated IMAGE_CREDITS.md: ${uses.size} photos.`);
