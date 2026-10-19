import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Five stars filled to the nearest half. The label is read out instead of the icons. */
export function RatingStars({
  rating,
  count,
  size = "sm",
  className,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const rounded = Math.round(rating * 2) / 2;
  const label =
    count === 0
      ? "No reviews yet"
      : `Rated ${rating.toFixed(1)} out of 5${count !== undefined ? ` from ${count} review${count === 1 ? "" : "s"}` : ""}`;
  const icon = size === "sm" ? "size-3.5" : "size-4.5";

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex" role="img" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => {
          const fill = rounded >= n ? 1 : rounded >= n - 0.5 ? 0.5 : 0;
          return (
            <span key={n} className={cn("relative", icon)} aria-hidden="true">
              <Star className={cn("absolute inset-0 text-line-strong", icon)} strokeWidth={1.5} />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className={cn("fill-accent text-accent", icon)} strokeWidth={1.5} />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-ink-muted" aria-hidden="true">
          ({count})
        </span>
      )}
    </span>
  );
}
