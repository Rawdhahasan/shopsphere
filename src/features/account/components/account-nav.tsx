"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, LayoutGrid, MapPin, UserRound } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/account", label: "Overview", icon: LayoutGrid },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/password", label: "Password", icon: KeyRound },
];

function AccountNavList({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          pathname !== null &&
          (href === "/account" ? pathname === href : pathname.startsWith(href));
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
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
  );
}

function AccountNavWithActive() {
  return <AccountNavList pathname={usePathname()} />;
}

export function AccountNav() {
  return (
    <nav aria-label="Account">
      {/* The active highlight needs the URL, which isn't known ahead of time on /addresses/[id]. */}
      <Suspense fallback={<AccountNavList pathname={null} />}>
        <AccountNavWithActive />
      </Suspense>
    </nav>
  );
}
