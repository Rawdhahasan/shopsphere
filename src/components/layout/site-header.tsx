"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

const iconLink =
  "inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);

  // Close the mobile menu after navigating (adjusting state during render, not in an effect).
  if (menuOpen && openedAt !== pathname) {
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
      <div className="bg-ink py-2 text-center text-xs tracking-wide text-canvas">
        {siteConfig.announcement}
      </div>
      <Container className="flex h-16 items-center gap-4 lg:h-20">
        <button
          type="button"
          className={cn(iconLink, "-ml-2 lg:hidden")}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => {
            setOpenedAt(pathname);
            setMenuOpen((open) => !open);
          }}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Logo className="lg:mr-6" />

        <nav aria-label="Main" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-7">
            {siteConfig.storeNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className="text-sm text-ink-soft transition-colors hover:text-ink aria-[current=page]:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link href="/search" className={iconLink} aria-label="Search">
            <Search className="size-5" strokeWidth={1.75} />
          </Link>
          <Link
            href="/wishlist"
            className={cn(iconLink, "hidden sm:inline-flex")}
            aria-label="Wishlist"
          >
            <Heart className="size-5" strokeWidth={1.75} />
          </Link>
          <Link href="/account" className={iconLink} aria-label="Account">
            <User className="size-5" strokeWidth={1.75} />
          </Link>
          <Link href="/cart" className={iconLink} aria-label="Cart">
            <ShoppingBag className="size-5" strokeWidth={1.75} />
          </Link>
        </div>
      </Container>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-[6.25rem] bottom-0 animate-fade-in bg-canvas lg:hidden"
        >
          <nav aria-label="Mobile">
            <Container>
              <ul className="divide-y divide-line">
                {siteConfig.storeNav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block py-4 font-display text-2xl">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/wishlist" className="block py-4 text-ink-soft">
                    Wishlist
                  </Link>
                </li>
              </ul>
            </Container>
          </nav>
        </div>
      )}
    </header>
  );
}
