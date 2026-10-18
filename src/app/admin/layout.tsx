import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Skeleton } from "@/components/ui";
import { AdminGate } from "@/features/admin/admin-gate";
import { AdminUserMenu } from "@/features/admin/admin-user-menu";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · ShopSphere Admin" },
  robots: { index: false, follow: false },
};

function AdminContentSkeleton() {
  return (
    <div className="space-y-6 p-6 lg:p-10" aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}

/**
 * Admin shell. Layer 1 (proxy) already requires sign-in; AdminGate (layer 2)
 * checks the admin role in the database before any admin page renders.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas lg:flex-row">
      <AdminSidebar
        account={
          <Suspense fallback={null}>
            <AdminUserMenu />
          </Suspense>
        }
      />
      <main id="main" className="min-w-0 flex-1">
        <Suspense fallback={<AdminContentSkeleton />}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}
