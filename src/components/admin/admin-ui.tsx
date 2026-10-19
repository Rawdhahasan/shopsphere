import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Padding wrapper for admin page content below the header. */
export function AdminContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-6 p-6 lg:p-10", className)} {...props} />;
}

export function AdminCard({
  title,
  actions,
  className,
  children,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border border-line bg-surface", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          {title && <h2 className="font-sans text-sm font-medium">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function AdminTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-line bg-surface", className)}>
      <table className="w-full min-w-[40rem] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line px-4 py-3 text-xs font-medium tracking-wide whitespace-nowrap text-ink-muted uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("border-b border-line px-4 py-3 align-middle", className)} {...props} />;
}

/** GET form for list pages: search box plus optional filter selects. Works without JavaScript. */
export function AdminFilters({
  action,
  q,
  placeholder,
  filters = [],
}: {
  action: string;
  q?: string;
  placeholder: string;
  filters?: { name: string; value: string; options: { value: string; label: string }[] }[];
}) {
  return (
    <form method="get" action={action} className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-60 flex-1 sm:max-w-sm">
        <span className="sr-only">Search</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
        <input
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          className="h-10 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-sm focus-visible:border-ink focus-visible:outline-none"
        />
      </label>
      {filters.map((filter) => (
        <label key={filter.name}>
          <span className="sr-only">{filter.name}</span>
          <select
            name={filter.name}
            defaultValue={filter.value}
            className="h-10 rounded-md border border-line-strong bg-surface px-3 text-sm"
          >
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button
        type="submit"
        className="h-10 rounded-md bg-ink px-4 text-sm font-medium text-canvas hover:bg-ink-soft"
      >
        Apply
      </button>
      {(q || filters.some((f) => f.value)) && (
        <Link href={action} className="px-2 text-sm text-ink-muted underline underline-offset-4">
          Reset
        </Link>
      )}
    </form>
  );
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong p-10 text-center text-sm text-ink-muted">
      {children}
    </div>
  );
}

export const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});
