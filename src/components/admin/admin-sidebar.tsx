"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { adminNav } from "@/config/admin-nav";
import { cn } from "@/lib/utils/cn";

function isActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

const adminBadge = (
  <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-medium tracking-wider text-ink-muted uppercase">
    Admin
  </span>
);

function AdminNav({ pathname, account }: { pathname: string | null; account?: ReactNode }) {
  const items = adminNav.flatMap((group) => group.items);

  return (
    <>
      {/* Small screens: compact top bar with a scrollable section list. */}
      <div className="sticky top-0 z-30 border-b border-line bg-surface lg:hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          <Logo href="/admin" className="text-lg" />
          {adminBadge}
        </div>
        <nav aria-label="Admin sections" className="overflow-x-auto px-2 pb-2">
          <ul className="flex gap-1">
            {items.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={pathname !== null && isActive(pathname, href) ? "page" : undefined}
                  className="block rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-ink-muted aria-[current=page]:bg-ink aria-[current=page]:text-canvas"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-line px-6">
          <Logo href="/admin" className="text-lg" />
          {adminBadge}
        </div>
        <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
          {adminNav.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[11px] font-medium tracking-[0.16em] text-ink-faint uppercase">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(({ label, href, icon: Icon }) => {
                  const active = pathname !== null && isActive(pathname, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-subtle font-medium text-ink"
                            : "text-ink-muted hover:bg-subtle/60 hover:text-ink",
                        )}
                      >
                        <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line p-3">
          {account}
          <Link
            href="/"
            className="block rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-subtle hover:text-ink"
          >
            ← View storefront
          </Link>
        </div>
      </aside>
    </>
  );
}

function AdminNavWithActive({ account }: { account?: ReactNode }) {
  return <AdminNav pathname={usePathname()} account={account} />;
}

/**
 * `account` is a server-rendered slot showing the signed-in admin. The active
 * highlight needs the URL, which is unknown ahead of time on pages like
 * /admin/products/[id], so it streams in behind Suspense.
 */
export function AdminSidebar({ account }: { account?: ReactNode }) {
  return (
    <Suspense fallback={<AdminNav pathname={null} account={account} />}>
      <AdminNavWithActive account={account} />
    </Suspense>
  );
}
