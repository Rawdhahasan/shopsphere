import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { buttonVariants, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { filtersToQuery, type ProductFilters } from "../filters";
import { listCategories, listProducts } from "../queries";
import { CatalogSidebar, CatalogToolbar } from "./catalog-controls";
import { ProductGrid } from "./product-card";

/**
 * Filters, toolbar, grid and pagination for /products, /search and
 * /categories/[slug]. Data comes from cached queries keyed by the filters.
 */
export async function ProductListing({
  filters,
  basePath,
  fixedCategory,
  autoFocusSearch,
}: {
  filters: ProductFilters;
  basePath: string;
  fixedCategory?: string;
  autoFocusSearch?: boolean;
}) {
  const [result, categories] = await Promise.all([listProducts(filters), listCategories()]);
  const controls = { filters, categories, fixedCategory };
  const omitCategory = Boolean(fixedCategory);
  const pageHref = (page: number) =>
    `${basePath}${filtersToQuery({ ...filters, page }, { omitCategory })}`;

  return (
    <div className="grid gap-10 lg:grid-cols-[13rem_1fr] xl:gap-14">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-28">
          <CatalogSidebar {...controls} />
        </div>
      </aside>

      <div className="min-w-0">
        <CatalogToolbar {...controls} total={result.total} autoFocusSearch={autoFocusSearch} />

        <div className="mt-8">
          {result.products.length > 0 ? (
            <ProductGrid products={result.products} priorityCount={4} />
          ) : (
            <EmptyState
              icon={SearchX}
              title={filters.q ? `No results for “${filters.q}”` : "No products match"}
              description="Try a different search, or remove a filter or two."
              action={
                <Link href={basePath} className={buttonVariants({ variant: "secondary" })}>
                  Clear all filters
                </Link>
              }
            />
          )}
        </div>

        {result.pageCount > 1 && (
          <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1.5">
            <PageLink
              href={pageHref(result.page - 1)}
              disabled={result.page <= 1}
              label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </PageLink>
            {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={pageHref(page)}
                aria-current={page === result.page ? "page" : undefined}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-sm transition-colors",
                  page === result.page ? "bg-ink text-canvas" : "text-ink-soft hover:bg-subtle",
                )}
              >
                {page}
              </Link>
            ))}
            <PageLink
              href={pageHref(result.page + 1)}
              disabled={result.page >= result.pageCount}
              label="Next page"
            >
              <ChevronRight className="size-4" />
            </PageLink>
          </nav>
        )}
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className =
    "flex size-10 items-center justify-center rounded-full border border-line text-ink-soft";
  if (disabled) {
    return (
      <span className={cn(className, "opacity-40")} aria-hidden="true">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cn(className, "hover:border-ink")}>
      {children}
    </Link>
  );
}

export function ProductListingSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[13rem_1fr] xl:gap-14" aria-busy="true">
      <span className="sr-only" role="status">
        Loading products…
      </span>
      <div className="hidden space-y-3 lg:block">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-5 w-32 animate-pulse rounded bg-subtle" />
        ))}
      </div>
      <div>
        <div className="h-11 w-full max-w-sm animate-pulse rounded-full bg-subtle" />
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/5] animate-pulse rounded-lg bg-subtle" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-subtle" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-subtle" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
