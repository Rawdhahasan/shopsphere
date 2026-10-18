"use client";

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

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-line px-6">
        <Logo href="/admin" className="text-lg" />
        <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-medium tracking-wider text-ink-muted uppercase">
          Admin
        </span>
      </div>
      <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {adminNav.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-medium tracking-[0.16em] text-ink-faint uppercase">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ label, href, icon: Icon }) => {
                const active = isActive(pathname, href);
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
      <div className="border-t border-line p-4">
        <Link
          href="/"
          className="block rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-subtle hover:text-ink"
        >
          ← View storefront
        </Link>
      </div>
    </aside>
  );
}
