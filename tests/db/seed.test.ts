// @vitest-environment node
/**
 * Seed data tests: the generated supabase/seed.sql must load cleanly on top of
 * the migrations, be safe to run twice, and produce a consistent catalog.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { products as catalog } from "../../supabase/seed/catalog";

const root = join(import.meta.dirname, "../..");
const seedSql = readFileSync(join(root, "supabase/seed.sql"), "utf8");
let db: PGlite;

async function rows<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return (await db.query<T>(sql, params)).rows;
}

async function asAnon<T>(fn: () => Promise<T>) {
  await db.exec("set role anon");
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(join(root, "tests/db/supabase-stub.sql"), "utf8"));
  const dir = join(root, "supabase/migrations");
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }
  await db.exec(seedSql);
}, 60_000);

const count = async (table: string) =>
  Number((await rows<{ n: number }>(`select count(*)::int as n from public.${table}`))[0].n);

describe("seed data", () => {
  it("matches the catalog", async () => {
    expect(await count("categories")).toBe(5);
    expect(await count("products")).toBe(catalog.length);
    expect(await count("product_variants")).toBe(
      catalog.reduce((sum, p) => sum + p.variants.length, 0),
    );
  });

  it("can be applied twice without duplicating anything", async () => {
    const before = await Promise.all(
      [
        "categories",
        "products",
        "product_variants",
        "product_images",
        "inventory_movements",
        "discount_codes",
      ].map(count),
    );
    await db.exec(seedSql);
    const after = await Promise.all(
      [
        "categories",
        "products",
        "product_variants",
        "product_images",
        "inventory_movements",
        "discount_codes",
      ].map(count),
    );
    expect(after).toEqual(before);
  });

  it("never overwrites data changed after the first run", async () => {
    await db.exec(`
      update public.store_settings set store_name = 'My Store', support_email = 'owner@example.com' where id = 1;
      update public.product_variants set price_cents = 12345 where sku = 'PLT';
      update public.products set name = 'Renamed Lamp' where slug = 'pleat-floor-lamp';
    `);
    await db.exec(seedSql);

    const [settings] = await rows<{ store_name: string; support_email: string }>(
      "select store_name, support_email from public.store_settings",
    );
    expect(settings).toEqual({ store_name: "My Store", support_email: "owner@example.com" });
    const [variant] = await rows<{ price_cents: number }>(
      "select price_cents from public.product_variants where sku = 'PLT'",
    );
    expect(variant).toEqual({ price_cents: 12345 });
    const [product] = await rows<{ name: string }>(
      "select name from public.products where slug = 'pleat-floor-lamp'",
    );
    expect(product.name).toBe("Renamed Lamp");
  });

  it("shows visitors every active product and hides the draft", async () => {
    const visible = await asAnon(() => rows<{ slug: string }>("select slug from public.products"));
    expect(visible).toHaveLength(catalog.filter((p) => (p.status ?? "active") === "active").length);
    expect(visible.map((p) => p.slug)).not.toContain("travertine-bookends");
  });

  it("gives every active product a variant, an image and a price range", async () => {
    const incomplete = await rows(`
      select p.slug from public.products p
      where p.status = 'active' and (
        p.min_price_cents is null
        or not exists (select 1 from public.product_variants v where v.product_id = p.id and v.is_active)
        or not exists (select 1 from public.product_images i where i.product_id = p.id)
      )`);
    expect(incomplete).toEqual([]);
  });

  it("links each variant to exactly one value per product option, with no duplicate combinations", async () => {
    const mismatched = await rows(`
      select v.sku from public.product_variants v
      where (select count(*) from public.product_variant_options pvo where pvo.variant_id = v.id)
         <> (select count(*) from public.product_options o where o.product_id = v.product_id)`);
    expect(mismatched).toEqual([]);

    const duplicates = await rows(`
      select v.product_id, v.title, count(*) from public.product_variants v
      group by 1, 2 having count(*) > 1`);
    expect(duplicates).toEqual([]);

    const crossProduct = await rows(`
      select v.sku from public.product_variant_options pvo
      join public.product_variants v on v.id = pvo.variant_id
      join public.product_option_values ov on ov.id = pvo.option_value_id
      join public.product_options o on o.id = ov.option_id
      where o.product_id <> v.product_id`);
    expect(crossProduct).toEqual([]);
  });

  it("only uses variant images that belong to the same product", async () => {
    const wrong = await rows(`
      select v.sku from public.product_variants v
      join public.product_images i on i.id = v.image_id
      where i.product_id <> v.product_id`);
    expect(wrong).toEqual([]);
  });

  it("records opening stock in the inventory log", async () => {
    const drift = await rows(`
      select v.sku from public.product_variants v
      where v.stock_quantity <> coalesce(
        (select sum(quantity_change) from public.inventory_movements m where m.variant_id = v.id), 0)`);
    expect(drift).toEqual([]);
  });

  it("includes sold-out, low-stock and on-sale variants for testing the UI", async () => {
    const [stats] = await rows<{ sold_out: number; low: number; on_sale: number }>(`
      select count(*) filter (where stock_quantity = 0)::int as sold_out,
             count(*) filter (where stock_quantity between 1 and low_stock_threshold)::int as low,
             count(*) filter (where compare_at_price_cents is not null)::int as on_sale
      from public.product_variants`);
    expect(stats.sold_out).toBeGreaterThan(0);
    expect(stats.low).toBeGreaterThan(0);
    expect(stats.on_sale).toBeGreaterThan(0);
  });

  it("creates valid, expired and exhausted discount codes", async () => {
    const codes = await rows<{ code: string }>(
      "select code from public.discount_codes order by code",
    );
    expect(codes.map((c) => c.code)).toEqual(["LAUNCH5", "SAVE25", "SUMMER30", "WELCOME10"]);
  });
});
