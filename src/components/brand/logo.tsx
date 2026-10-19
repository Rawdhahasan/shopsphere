import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

/**
 * The ShopSphere mark: an arched doorway inside a sphere, standing on a
 * horizon line. "A way into a calmer home." Drawn on a 32-unit grid; the same
 * geometry is used for the favicon (src/app/icon.svg) and app icons.
 */
export const MARK_PATHS = {
  circle: { cx: 16, cy: 16, r: 14.25 },
  door: "M11 24.5V14.75a5 5 0 0 1 10 0V24.5Z",
  horizon: "M4.4 24.5h23.2",
} as const;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden="true">
      <circle {...MARK_PATHS.circle} fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d={MARK_PATHS.door} className="fill-accent" />
      <path d={MARK_PATHS.horizon} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} home`}
      className={cn(
        "inline-flex items-center gap-2.5 font-display text-[1.35rem] tracking-tight text-ink",
        className,
      )}
    >
      <LogoMark />
      <span aria-hidden="true">
        Shop<span className="italic">Sphere</span>
      </span>
    </Link>
  );
}
