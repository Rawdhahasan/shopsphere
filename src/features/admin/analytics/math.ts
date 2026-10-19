/** Pure helpers for analytics (unit-tested). */

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRange(raw: unknown): RangeDays {
  const n = Number(raw);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

/** Percentage change, or null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** UTC day keys (YYYY-MM-DD) from `days` ago up to today, oldest first. */
export function dayKeys(days: number, now = new Date()): string[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: days }, (_, i) =>
    new Date(today - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10),
  );
}

/** A clean axis maximum (1, 2, 2.5 or 5 × 10^n) at or above `max`, and evenly spaced ticks. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const rough = max / count;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? 10 * power;
  const top = Math.ceil(max / step) * step;
  return Array.from(
    { length: Math.round(top / step) + 1 },
    (_, i) => Math.round(i * step * 100) / 100,
  );
}

/** $1,135 → "$1.1K", $980 → "$980" (cents in). For axis ticks and chart labels. */
export function compactMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: cents >= 100_000 ? 1 : 0,
  }).format(cents / 100);
}
