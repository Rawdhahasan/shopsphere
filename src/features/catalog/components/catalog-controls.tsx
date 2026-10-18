"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_FILTERS,
  filtersToQuery,
  hasActiveFilters,
  PRICE_RANGES,
  SORT_OPTIONS,
  type ProductFilters,
  type SortId,
} from "../filters";

type CategoryLink = { slug: string; name: string; productCount: number };

type ControlProps = {
  filters: ProductFilters;
  categories: CategoryLink[];
  /** Set on /categories/[slug], where the category comes from the URL path. */
  fixedCategory?: string;
};

/** Every change becomes a new URL; the server renders the matching products. */
function useCatalogNavigation({ filters, fixedCategory }: ControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const omitCategory = Boolean(fixedCategory);

  function apply(changes: Partial<ProductFilters>) {
    const next = { ...filters, ...changes, page: changes.page ?? 1 };
    startTransition(() =>
      router.push(`${pathname}${filtersToQuery(next, { omitCategory })}`, { scroll: false }),
    );
  }
  const clearHref = `${pathname}${filtersToQuery(
    { ...DEFAULT_FILTERS, sort: filters.sort, category: fixedCategory ?? null },
    { omitCategory },
  )}`;
  return {
    apply,
    pending,
    clearHref,
    active: hasActiveFilters(filters, { ignoreCategory: omitCategory }),
  };
}

function FilterPanel(props: ControlProps & { nav: ReturnType<typeof useCatalogNavigation> }) {
  const { filters, categories, fixedCategory, nav } = props;
  const { apply } = nav;
  return (
    <div className="space-y-8">
      {!fixedCategory && (
        <fieldset>
          <legend className="mb-3 text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">
            Category
          </legend>
          <ul className="space-y-1.5 text-sm">
            <li>
              <FilterOption
                selected={!filters.category}
                onClick={() => apply({ category: null })}
                label="All products"
              />
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <FilterOption
                  selected={filters.category === c.slug}
                  onClick={() => apply({ category: c.slug })}
                  label={c.name}
                  count={c.productCount}
                />
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">
          Price
        </legend>
        <ul className="space-y-1.5 text-sm">
          {PRICE_RANGES.map((range) => (
            <li key={range.id}>
              <FilterOption
                selected={filters.price === range.id}
                onClick={() => apply({ price: filters.price === range.id ? null : range.id })}
                label={range.label}
              />
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="space-y-3 text-sm">
        <legend className="mb-3 text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">
          Availability
        </legend>
        <Toggle
          label="In stock only"
          checked={filters.inStock}
          onChange={(inStock) => apply({ inStock })}
        />
        <Toggle label="On sale" checked={filters.onSale} onChange={(onSale) => apply({ onSale })} />
      </fieldset>

      {nav.active && (
        <Link
          href={nav.clearHref}
          scroll={false}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          <X className="size-3.5" aria-hidden="true" /> Clear filters
        </Link>
      )}
    </div>
  );
}

/** Desktop filter sidebar. */
export function CatalogSidebar(props: ControlProps) {
  const nav = useCatalogNavigation(props);
  return <FilterPanel {...props} nav={nav} />;
}

/** Search box, result count, sort menu, and the mobile filter panel. */
export function CatalogToolbar({
  total,
  autoFocusSearch = false,
  ...props
}: ControlProps & { total: number; autoFocusSearch?: boolean }) {
  const { filters } = props;
  const nav = useCatalogNavigation(props);
  const { apply, pending, active } = nav;
  const [panelOpen, setPanelOpen] = useState(false);
  const [query, setQuery] = useState(filters.q);
  const searchRef = useRef<HTMLInputElement>(null);

  // Follow the URL when it changes elsewhere (back button, "clear filters").
  const [syncedQuery, setSyncedQuery] = useState(filters.q);
  if (syncedQuery !== filters.q) {
    setSyncedQuery(filters.q);
    setQuery(filters.q);
  }
  useEffect(() => {
    if (autoFocusSearch) searchRef.current?.focus();
  }, [autoFocusSearch]);

  const filterPanel = <FilterPanel {...props} nav={nav} />;

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <form
          role="search"
          className="relative w-full sm:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q: query.trim() });
          }}
        >
          <label htmlFor="catalog-search" className="sr-only">
            Search products
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            ref={searchRef}
            id="catalog-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lamps, linen, oak…"
            maxLength={80}
            className="h-11 w-full rounded-full border border-line-strong bg-surface pr-4 pl-10 text-sm placeholder:text-ink-faint focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/10 focus-visible:outline-none"
          />
        </form>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-sm text-ink-muted" aria-live="polite">
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="size-3.5" /> Updating…
              </span>
            ) : (
              `${total} ${total === 1 ? "product" : "products"}`
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm lg:hidden"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Filters
              {active && <span className="size-1.5 rounded-full bg-accent" aria-label="(active)" />}
            </button>
            <label htmlFor="catalog-sort" className="sr-only">
              Sort by
            </label>
            <select
              id="catalog-sort"
              value={filters.sort}
              onChange={(e) => apply({ sort: e.target.value as SortId })}
              className="h-10 cursor-pointer rounded-full border border-line-strong bg-surface px-4 text-sm focus-visible:border-ink focus-visible:outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile: slide-over panel */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <button
            type="button"
            className="absolute inset-0 animate-fade-in bg-ink/30"
            aria-label="Close filters"
            onClick={() => setPanelOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-canvas shadow-lifted">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="font-medium">Filters</p>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-full p-2 hover:bg-subtle"
                aria-label="Close filters"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">{filterPanel}</div>
            <div className="border-t border-line p-4">
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="h-11 w-full rounded-full bg-ink text-sm font-medium text-canvas"
              >
                Show {total} {total === 1 ? "product" : "products"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterOption({
  selected,
  onClick,
  label,
  count,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-subtle",
        selected ? "font-medium text-ink" : "text-ink-soft",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "size-1.5 rounded-full transition-colors",
            selected ? "bg-accent" : "bg-transparent",
          )}
          aria-hidden="true"
        />
        {label}
      </span>
      {count !== undefined && <span className="text-xs text-ink-faint">{count}</span>}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 px-2">
      <span className="text-ink-soft">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="relative h-5 w-9 rounded-full bg-line-strong transition-colors peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-ink/20 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
  );
}
