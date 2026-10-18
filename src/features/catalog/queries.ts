import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env/public";
import { createPublicClient } from "@/lib/supabase/public";
import { publicStorageUrl } from "@/lib/supabase/storage";
import { PAGE_SIZE, PRICE_RANGES, type ProductFilters } from "./filters";
import type { ProductOption, ProductVariant } from "./variants";

/**
 * Public catalog reads. Everything here is the same for every visitor, so it
 * runs with the cookie-free public client inside "use cache" and is tagged
 * "catalog" so admin edits (Phase 8) can refresh it with updateTag("catalog").
 */
export const CATALOG_TAG = "catalog";

export type CatalogImage = { id: string; url: string; alt: string };

export type CategorySummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
};

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  categoryName: string | null;
  priceCents: number;
  maxPriceCents: number;
  compareAtCents: number | null;
  onSale: boolean;
  inStock: boolean;
  lowStock: boolean;
  rating: number;
  reviewCount: number;
  image: CatalogImage | null;
  hoverImage: CatalogImage | null;
};

export type ProductDetail = ProductCardData & {
  categoryId: string | null;
  categorySlug: string | null;
  shortDescription: string | null;
  description: string | null;
  specifications: { label: string; value: string }[];
  seoTitle: string | null;
  seoDescription: string | null;
  images: CatalogImage[];
  options: ProductOption[];
  variants: ProductVariant[];
};

export type ProductReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  verified: boolean;
  createdAt: string;
  author: string;
};

export type ProductPage = {
  products: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
};

const CARD_FIELDS = `id, slug, name, brand, min_price_cents, max_price_cents, total_stock, avg_rating, review_count,
  images:product_images(id, storage_path, alt_text, position),
  variants:product_variants(price_cents, compare_at_price_cents, stock_quantity)`;

type ImageRow = { id: string; storage_path: string; alt_text: string; position: number };
type CardRow = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  min_price_cents: number | null;
  max_price_cents: number | null;
  total_stock: number;
  avg_rating: number;
  review_count: number;
  category: { slug: string; name: string } | null;
  images: ImageRow[];
  variants: {
    price_cents: number;
    compare_at_price_cents: number | null;
    stock_quantity: number;
  }[];
};

const LOW_STOCK_TOTAL = 5;

function toImages(rows: ImageRow[], fallbackAlt: string): CatalogImage[] {
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .flatMap((row) => {
      const url = publicStorageUrl("product-images", row.storage_path);
      return url ? [{ id: row.id, url, alt: row.alt_text || fallbackAlt }] : [];
    });
}

function toCard(row: CardRow): ProductCardData {
  const images = toImages(row.images, row.name);
  const cheapest = [...row.variants].sort((a, b) => a.price_cents - b.price_cents)[0];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    categoryName: row.category?.name ?? null,
    priceCents: row.min_price_cents ?? cheapest?.price_cents ?? 0,
    maxPriceCents: row.max_price_cents ?? row.min_price_cents ?? 0,
    compareAtCents: cheapest?.compare_at_price_cents ?? null,
    onSale: row.variants.some((v) => v.compare_at_price_cents !== null),
    inStock: row.total_stock > 0,
    lowStock: row.total_stock > 0 && row.total_stock <= LOW_STOCK_TOTAL,
    rating: Number(row.avg_rating),
    reviewCount: row.review_count,
    image: images[0] ?? null,
    hoverImage: images[1] ?? null,
  };
}

function cacheCatalog() {
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
}

export async function listCategories(): Promise<CategorySummary[]> {
  "use cache";
  cacheCatalog();
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, slug, name, description, image_path, products(count)")
    .is("parent_id", null)
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Couldn't load categories: ${error.message}`);

  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: publicStorageUrl("category-images", row.image_path),
    productCount: (row.products as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

export async function getCategory(slug: string): Promise<CategorySummary | null> {
  "use cache";
  cacheCatalog();
  return (await listCategories()).find((c) => c.slug === slug) ?? null;
}

export async function listProducts(filters: ProductFilters): Promise<ProductPage> {
  "use cache";
  cacheCatalog();
  if (!isSupabaseConfigured()) return { products: [], total: 0, page: 1, pageCount: 1 };

  const category = filters.category
    ? "category:categories!inner(slug, name)"
    : "category:categories(slug, name)";
  // A second, filtering-only join keeps just products with a variant on sale.
  const sale = filters.onSale ? ", sale:product_variants!inner(id)" : "";

  let query = createPublicClient()
    .from("products")
    .select(`${CARD_FIELDS}, ${category}${sale}`, { count: "exact" });

  if (filters.category) query = query.eq("category.slug", filters.category);
  if (filters.onSale) query = query.not("sale.compare_at_price_cents", "is", null);
  if (filters.inStock) query = query.gt("total_stock", 0);
  if (filters.q) {
    // Full-text search on name, brand and descriptions, plus a name prefix match for partial words.
    query = query.or(`search_vector.wfts(english)."${filters.q}",name.ilike."*${filters.q}*"`);
  }
  const range = PRICE_RANGES.find((r) => r.id === filters.price);
  if (range) {
    query = query.gte("min_price_cents", range.min);
    if (range.max !== null) query = query.lte("min_price_cents", range.max);
  }

  switch (filters.sort) {
    case "newest":
      query = query.order("published_at", { ascending: false, nullsFirst: false });
      break;
    case "popular":
      query = query
        .order("avg_rating", { ascending: false })
        .order("review_count", { ascending: false });
      break;
    case "price-asc":
      query = query.order("min_price_cents", { ascending: true });
      break;
    case "price-desc":
      query = query.order("min_price_cents", { ascending: false });
      break;
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false });
  }
  query = query.order("id");

  const from = (filters.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  // Asking for a page past the end returns an error from PostgREST; treat it as empty.
  if (error && error.code !== "PGRST103") {
    throw new Error(`Couldn't load products: ${error.message}`);
  }
  const total = count ?? 0;
  return {
    products: ((data ?? []) as unknown as CardRow[]).map(toCard),
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  "use cache";
  cacheCatalog();
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createPublicClient()
    .from("products")
    .select(`${CARD_FIELDS}, category:categories(slug, name)`)
    .eq("is_featured", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`Couldn't load featured products: ${error.message}`);
  return (data as unknown as CardRow[]).map(toCard);
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheCatalog();
  if (!isSupabaseConfigured() || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;

  const { data, error } = await createPublicClient()
    .from("products")
    .select(
      `id, slug, name, brand, short_description, description, specifications, seo_title, seo_description,
       min_price_cents, max_price_cents, total_stock, avg_rating, review_count, category_id,
       category:categories(slug, name),
       images:product_images(id, storage_path, alt_text, position),
       options:product_options(id, name, position, values:product_option_values(id, value, swatch_hex, position)),
       variants:product_variants(id, sku, title, price_cents, compare_at_price_cents, stock_quantity,
         low_stock_threshold, image_id, position, options:product_variant_options(option_value_id))`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Couldn't load product: ${error.message}`);
  if (!data) return null;

  const variantRows = [...data.variants].sort((a, b) => a.position - b.position);
  const card = toCard({
    ...data,
    variants: variantRows,
  } as unknown as CardRow);
  const specifications = Array.isArray(data.specifications)
    ? (data.specifications as { label?: unknown; value?: unknown }[]).flatMap((s) =>
        typeof s?.label === "string" && typeof s?.value === "string"
          ? [{ label: s.label, value: s.value }]
          : [],
      )
    : [];

  return {
    ...card,
    categoryId: data.category_id,
    categorySlug: data.category?.slug ?? null,
    shortDescription: data.short_description,
    description: data.description,
    specifications,
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
    images: toImages(data.images, data.name),
    options: [...data.options]
      .sort((a, b) => a.position - b.position)
      .map((option) => ({
        id: option.id,
        name: option.name,
        values: [...option.values]
          .sort((a, b) => a.position - b.position)
          .map((v) => ({ id: v.id, value: v.value, swatchHex: v.swatch_hex })),
      })),
    variants: variantRows.map((v) => ({
      id: v.id,
      sku: v.sku,
      title: v.title,
      priceCents: v.price_cents,
      compareAtCents: v.compare_at_price_cents,
      stock: v.stock_quantity,
      lowStockThreshold: v.low_stock_threshold,
      imageId: v.image_id,
      optionValueIds: v.options.map((o) => o.option_value_id),
    })),
  };
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4,
): Promise<ProductCardData[]> {
  "use cache";
  cacheCatalog();
  if (!isSupabaseConfigured()) return [];

  let query = createPublicClient()
    .from("products")
    .select(`${CARD_FIELDS}, category:categories(slug, name)`)
    .neq("id", productId)
    .gt("total_stock", 0);
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query
    .order("is_featured", { ascending: false })
    .order("avg_rating", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Couldn't load related products: ${error.message}`);
  return (data as unknown as CardRow[]).map(toCard);
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  "use cache";
  cacheCatalog();
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await createPublicClient().rpc("get_product_reviews", {
    p_product_id: productId,
  });
  if (error) throw new Error(`Couldn't load reviews: ${error.message}`);
  return data.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    verified: r.is_verified_purchase,
    createdAt: r.created_at,
    author: r.author_name,
  }));
}

/** Cards for specific products (wishlist), in the order given. Unpublished products are skipped. */
export async function getProductCards(ids: string[]): Promise<ProductCardData[]> {
  "use cache";
  cacheCatalog();
  if (!isSupabaseConfigured() || ids.length === 0) return [];
  const { data, error } = await createPublicClient()
    .from("products")
    .select(`${CARD_FIELDS}, category:categories(slug, name)`)
    .in("id", ids);
  if (error) throw new Error(`Couldn't load products: ${error.message}`);
  const cards = new Map((data as unknown as CardRow[]).map((row) => [row.id, toCard(row)]));
  return ids.flatMap((id) => cards.get(id) ?? []);
}
