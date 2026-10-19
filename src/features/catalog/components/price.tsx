import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

/** A price, with the original price struck through when it's on sale. */
export function Price({
  cents,
  compareAtCents,
  from = false,
  className,
}: {
  cents: number;
  compareAtCents?: number | null;
  /** Prefix with "From" when variants have different prices. */
  from?: boolean;
  className?: string;
}) {
  const onSale = compareAtCents != null && compareAtCents > cents;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn(onSale && "text-accent-strong")}>
        {from && <span className="text-ink-muted">From </span>}
        {onSale && <span className="sr-only">Sale price </span>}
        {formatMoney(cents)}
      </span>
      {onSale && (
        <s className="text-[0.85em] text-ink-faint">
          <span className="sr-only">Original price </span>
          {formatMoney(compareAtCents)}
        </s>
      )}
    </span>
  );
}
