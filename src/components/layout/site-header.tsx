"use client";

import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

const iconLink =
  "inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle";

function MainNavLinks({ pathname }: { pathname: string | null }) {
  return (
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
  );
}

/**
 * Reading the URL suspends on pages with unknown dynamic params, so the active
 * highlight streams in while the plain links are part of the static shell.
 */
function MainNavWithActive({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  useEffect(() => onNavigate(), [onNavigate, pathname]);
  return <MainNavLinks pathname={pathname} />;
}

/**
 * `account` and `cart` are rendered by the server (they read the session and
 * cart cookie), so they're passed in as slots.
 */
export function SiteHeader({
  account,
  cart,
  announcement,
}: {
  account: ReactNode;
  cart: ReactNode;
  announcement: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
      <div className="bg-ink py-2 text-center text-xs tracking-wide text-canvas">
        {announcement}
      </div>
      <Container className="flex h-16 items-center gap-4 lg:h-20">
        <button
          type="button"
          className={cn(iconLink, "-ml-2 lg:hidden")}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Logo className="lg:mr-6" />

        <nav aria-label="Main" className="hidden flex-1 lg:block">
          <Suspense fallback={<MainNavLinks pathname={null} />}>
            <MainNavWithActive onNavigate={closeMenu} />
          </Suspense>
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
          {account}
          {cart}
        </div>
      </Container>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-[6.25rem] bottom-0 bg-canvas lg:hidden"
        >
          <nav aria-label="Mobile" className="animate-fade-in">
            <Container>
              <ul className="divide-y divide-line">
                {siteConfig.storeNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className="block py-4 font-display text-2xl"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/wishlist" onClick={closeMenu} className="block py-4 text-ink-soft">
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link href="/account" onClick={closeMenu} className="block py-4 text-ink-soft">
                    My account
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
