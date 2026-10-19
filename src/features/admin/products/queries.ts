import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

export type ProductStatus = Database["public"]["Enums"]["product_status"];
export const PRODUCT_STATUSES: ProductStatus[] = ["draft", "active", "archived"];
export const PAGE_SIZE = 25;

export async function listAdminProducts({
  q,
  status,
  category,
  page,
}: {
  q: string;
  status: string;
  category: string;
  page: number;
}) {
  if (!(await requireAdmin())) return null;
  const supabase = await createClient();
  let query = supabase.from("products").select(
    `id, name, slug, status, is_featured, min_price_cents, max_price_cents, total_stock, updated_at,
       category:categories(name), images:product_images(storage_path, position), variants:product_variants(count)`,
    { count: "exact" },
  );
  if (PRODUCT_STATUSES.includes(status as ProductStatus)) {
    query = query.eq("status", status as ProductStatus);
  }
  if (/^[0-9a-f-]{36}$/.test(category)) query = query.eq("category_id", category);
  const search = q
    .replace(/[^\p{L}\p{N} -]/gu, " ")
    .trim()
    .slice(0, 80);
  if (search) query = query.ilike("name", `%${search}%`);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query
    .order("updated_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error && error.code !== "PGRST103")
    throw new Error(`Couldn't load products: ${error.message}`);
  return {
    products: (data ?? []).map((p) => {
      const first = [...p.images].sort((a, b) => a.position - b.position)[0];
      return {
        ...p,
        imageUrl: first ? publicStorageUrl("product-images", first.storage_path) : null,
        variantCount: (p.variants as unknown as { count: number }[])[0]?.count ?? 0,
      };
    }),
    total: count ?? 0,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

export async function listCategoryChoices() {
  if (!(await requireAdmin())) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name")
    .order("sort_order")
    .order("name");
  return data ?? [];
}

export async function getAdminProduct(id: string) {
  if (!(await requireAdmin())) return null;
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, name, slug, status, is_featured, brand, short_description, description, specifications,
       seo_title, seo_description, category_id, total_stock, min_price_cents,
       options:product_options(id, name, position, values:product_option_values(id, value, swatch_hex, position)),
       variants:product_variants(id, sku, title, price_cents, compare_at_price_cents, stock_quantity,
         low_stock_threshold, image_id, is_active, position, options:product_variant_options(option_value_id)),
       images:product_images(id, storage_path, alt_text, position)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load the product: ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    specifications: Array.isArray(data.specifications)
      ? (data.specifications as { label?: unknown; value?: unknown }[]).flatMap((s) =>
          typeof s?.label === "string" && typeof s?.value === "string"
            ? [{ label: s.label, value: s.value }]
            : [],
        )
      : [],
    options: [...data.options]
      .sort((a, b) => a.position - b.position)
      .map((o) => ({ ...o, values: [...o.values].sort((a, b) => a.position - b.position) })),
    variants: [...data.variants].sort((a, b) => a.position - b.position),
    images: [...data.images]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ ...i, url: publicStorageUrl("product-images", i.storage_path) })),
  };
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;
