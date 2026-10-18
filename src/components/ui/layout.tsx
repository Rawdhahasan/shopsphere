import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

/** Centers content with consistent page gutters. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10", className)} {...props} />
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-lg border border-line bg-surface", className)} {...props} />;
}

/** Small uppercase label above a heading ("New season", "Overview"). */
export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs font-medium tracking-[0.18em] text-ink-muted uppercase", className)}
      {...props}
    />
  );
}
