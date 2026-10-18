/**
 * Catalog filters live in the URL (?q=lamp&price=50-150&sort=newest), so
 * results are shareable, bookmarkable and work without JavaScript. Parsing is
 * lenient: anything unexpected falls back to the default instead of erroring.
 */

export const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "popular", label: "Best rated" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
] as const;

export type SortId = (typeof SORT_OPTIONS)[number]["id"];

/** Price buckets in cents, matched against a product's lowest variant price. */
export const PRICE_RANGES = [
  { id: "under-50", label: "Under $50", min: 0, max: 4_999 },
  { id: "50-150", label: "$50 – $150", min: 5_000, max: 15_000 },
  { id: "150-500", label: "$150 – $500", min: 15_001, max: 50_000 },
  { id: "500-plus", label: "Over $500", min: 50_001, max: null },
] as const;

export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];

export const PAGE_SIZE = 12;
const MAX_QUERY_LENGTH = 80;

export type ProductFilters = {
  q: string;
  category: string | null;
  price: PriceRangeId | null;
  inStock: boolean;
  onSale: boolean;
  sort: SortId;
  page: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const DEFAULT_FILTERS: ProductFilters = {
  q: "",
  category: null,
  price: null,
  inStock: false,
  onSale: false,
  sort: "featured",
  page: 1,
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Keeps letters, digits, spaces and hyphens: enough for product search, safe in a PostgREST filter. */
export function sanitizeQuery(raw: string | undefined): string {
  return (raw ?? "")
    .replace(/[^\p{L}\p{N} -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

export function parseFilters(params: RawSearchParams, fixed: { category?: string } = {}) {
  const sort = first(params.sort);
  const price = first(params.price);
  const category = first(params.category);
  const page = Number.parseInt(first(params.page) ?? "1", 10);

  return {
    q: sanitizeQuery(first(params.q)),
    category:
      fixed.category ?? (category && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(category) ? category : null),
    price: PRICE_RANGES.some((r) => r.id === price) ? (price as PriceRangeId) : null,
    inStock: first(params.in_stock) === "1",
    onSale: first(params.on_sale) === "1",
    sort: SORT_OPTIONS.some((s) => s.id === sort) ? (sort as SortId) : DEFAULT_FILTERS.sort,
    page: Number.isSafeInteger(page) && page >= 1 && page <= 1000 ? page : 1,
  } satisfies ProductFilters;
}

/**
 * Builds the query string for a set of filters, leaving out defaults. A
 * category fixed by the route (/categories/[slug]) is never repeated.
 */
export function filtersToQuery(
  filters: ProductFilters,
  { omitCategory = false }: { omitCategory?: boolean } = {},
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category && !omitCategory) params.set("category", filters.category);
  if (filters.price) params.set("price", filters.price);
  if (filters.inStock) params.set("in_stock", "1");
  if (filters.onSale) params.set("on_sale", "1");
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** True when any filter that narrows results is active (search counts too). */
export function hasActiveFilters(filters: ProductFilters, { ignoreCategory = false } = {}) {
  return Boolean(
    filters.q ||
    (!ignoreCategory && filters.category) ||
    filters.price ||
    filters.inStock ||
    filters.onSale,
  );
}
