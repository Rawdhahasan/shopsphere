import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · ShopSphere Admin" },
  robots: { index: false, follow: false },
};

/**
 * Admin shell.
 * Phase 3 adds a server-side `requireAdmin()` check here. Until then the proxy
 * only requires sign-in, and no admin page reads or changes real data.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <AdminSidebar />
      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
