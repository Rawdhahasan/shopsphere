import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

/** Stat tile: label, value and the change against the previous period (up is good for sales). */
export function StatTile({
  label,
  value,
  change,
  periodLabel,
}: {
  label: string;
  value: string;
  change: number | null;
  periodLabel: string;
}) {
  const direction = change === null || change === 0 ? "flat" : change > 0 ? "up" : "down";
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 font-sans text-3xl font-semibold tracking-tight">{value}</p>
      <p
        className={cn(
          "mt-2 flex items-center gap-1 text-xs",
          direction === "up" && "text-success",
          direction === "down" && "text-danger",
          direction === "flat" && "text-ink-muted",
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        <span>
          {change === null ? "New" : `${change > 0 ? "+" : ""}${change}%`}
          <span className="text-ink-muted"> vs {periodLabel}</span>
        </span>
      </p>
    </div>
  );
}

/** Horizontal bars in one hue, value at the tip. Labels and values use text colours, not the bar colour. */
export function BarList({
  rows,
  emptyText,
}: {
  rows: { label: string; cents: number; href?: string }[];
  emptyText: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-ink-muted">{emptyText}</p>;
  const max = Math.max(...rows.map((r) => r.cents), 1);
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label} className="grid grid-cols-[8rem_1fr] items-center gap-3 text-sm">
          <span className="truncate text-ink-soft" title={row.label}>
            {row.href ? (
              <Link href={row.href} className="hover:underline">
                {row.label}
              </Link>
            ) : (
              row.label
            )}
          </span>
          <span
            className="flex items-center gap-2"
            title={`${row.label}: ${formatMoney(row.cents)}`}
          >
            <span
              className="block h-5 rounded-r bg-chart transition-opacity hover:opacity-80"
              style={{ width: `max(2px, ${(row.cents / max) * 85}%)` }}
              aria-hidden="true"
            />
            <span className="text-xs whitespace-nowrap text-ink tabular-nums">
              {formatMoney(row.cents)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
