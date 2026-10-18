import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 font-display text-xl tracking-tight text-ink",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.5 12h21" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" className="fill-accent" />
      </svg>
      <span>{siteConfig.name}</span>
    </Link>
  );
}
