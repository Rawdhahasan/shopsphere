import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui";
import { getDashboardStats } from "@/features/admin/dashboard-stats";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Dashboard" };

/**
 * Layouts and pages render in parallel, so AdminGate in the layout can't stop
 * this page from running. Every admin page checks the role itself.
 */
export default async function AdminDashboardPage() {
  if (!(await requireAdmin())) return null;
  const stats = await getDashboardStats();
  if (!stats) return null;

  const kpis = [
    { label: "Revenue (30 days)", value: formatMoney(stats.revenue30dCents), icon: DollarSign },
    { label: "Orders (30 days)", value: String(stats.orders30d), icon: ShoppingCart },
    { label: "Customers", value: String(stats.customers), icon: Users },
    { label: "Low-stock variants", value: String(stats.lowStockVariants), icon: Package },
  ];

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Store performance at a glance. Detailed analytics arrive in Phase 10."
      />
      <div className="space-y-6 p-6 lg:p-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="p-5">
              <div className="flex items-center justify-between text-ink-muted">
                <p className="text-sm">{label}</p>
                <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <p className="mt-3 font-display text-3xl font-light">{value}</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
