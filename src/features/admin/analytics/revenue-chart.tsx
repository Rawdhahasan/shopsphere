"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils/cn";
import { compactMoney, niceTicks } from "./math";

type Point = { date: string; revenueCents: number; orders: number };

const H = 240;
const PAD = { left: 48, right: 8, top: 12, bottom: 26 };
const MAX_BAR = 24;
const GAP = 2;
const dayLabel = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/**
 * Revenue per day as columns: sales are discrete days, so a line would
 * invent revenue between them. One series, one colour, no legend (the card
 * title names it). The chart is drawn at its real width so text stays at
 * 11px; pointer or arrow keys pick the nearest day, and the same numbers are
 * in the table view below.
 */
export function RevenueChart({ data, label }: { data: Point[]; label: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(280, entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const n = data.length;
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.revenueCents)), 4);
  const top = ticks[ticks.length - 1] || 1;
  const plotW = width - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(1, n);
  const barW = Math.max(1, Math.min(MAX_BAR, slot - GAP));
  const xCenter = (i: number) => PAD.left + slot * i + slot / 2;
  const y = (v: number) => PAD.top + (1 - v / top) * plotH;
  const baseline = y(0);
  const labelEvery = Math.ceil(n / Math.max(2, Math.floor(plotW / 80)));

  function pick(clientX: number) {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const index = Math.floor((clientX - rect.left - PAD.left) / slot);
    setActive(Math.min(n - 1, Math.max(0, index)));
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      setActive((i) => (i === null ? n - 1 : Math.min(n - 1, Math.max(0, i + step))));
    } else if (event.key === "Escape") {
      setActive(null);
    }
  }

  const point = active !== null ? data[active] : null;

  return (
    <div ref={wrapperRef} className="relative">
      <svg
        width={width}
        height={H}
        viewBox={`0 0 ${width} ${H}`}
        className="block max-w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
        role="img"
        aria-labelledby={titleId}
        tabIndex={0}
        onPointerMove={(e: PointerEvent<SVGSVGElement>) => pick(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKeyDown}
      >
        <title
          id={titleId}
        >{`${label}. Use the left and right arrow keys to read each day.`}</title>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(t)}
              y2={y(t)}
              className="stroke-line"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              className="fill-ink-muted text-[11px] tabular-nums"
            >
              {compactMoney(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const h = baseline - y(d.revenueCents);
          if (h <= 0) return null;
          const x = xCenter(i) - barW / 2;
          const r = Math.min(4, barW / 2, h);
          // Rounded data end at the top, square at the baseline.
          const path = `M${x},${baseline}V${y(d.revenueCents) + r}Q${x},${y(d.revenueCents)} ${x + r},${y(d.revenueCents)}H${x + barW - r}Q${x + barW},${y(d.revenueCents)} ${x + barW},${y(d.revenueCents) + r}V${baseline}Z`;
          return (
            <path
              key={d.date}
              d={path}
              className={cn(
                "fill-chart transition-opacity",
                active !== null && active !== i && "opacity-40",
              )}
            />
          );
        })}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === n - 1
            ? (i === n - 1 || n - 1 - i >= labelEvery / 2) && (
                <text
                  key={d.date}
                  x={xCenter(i)}
                  y={H - 6}
                  textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                  className="fill-ink-muted text-[11px]"
                >
                  {dayLabel.format(new Date(`${d.date}T00:00:00Z`))}
                </text>
              )
            : null,
        )}
        {active !== null && (
          <line
            x1={xCenter(active)}
            x2={xCenter(active)}
            y1={PAD.top}
            y2={baseline}
            className="stroke-ink-faint"
            strokeWidth={1}
            aria-hidden="true"
          />
        )}
      </svg>
      {point && active !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-soft"
          style={{
            left: xCenter(active),
            transform:
              xCenter(active) > width * 0.65
                ? "translateX(calc(-100% - 10px))"
                : "translateX(10px)",
          }}
        >
          <p className="text-sm font-semibold text-ink">{formatMoney(point.revenueCents)}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-ink-muted">
            <span className="size-2 rounded-sm bg-chart" aria-hidden="true" />
            {dayLabel.format(new Date(`${point.date}T00:00:00Z`))} · {point.orders}{" "}
            {point.orders === 1 ? "order" : "orders"}
          </p>
        </div>
      )}
    </div>
  );
}
