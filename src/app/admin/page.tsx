import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Alert, Card } from "@/components/ui";

export const metadata = { title: "Dashboard" };

const kpis = [
  { label: "Revenue (30 days)", icon: DollarSign },
  { label: "Orders (30 days)", icon: ShoppingCart },
  { label: "Customers", icon: Users },
  { label: "Low-stock variants", icon: Package },
];

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader title="Dashboard" description="Store performance at a glance." />
      <div className="space-y-6 p-6 lg:p-10">
        <Alert tone="info" title="Not connected yet">
          Live statistics appear once the Supabase database is connected (Phase 2) and admin sign-in
          is enabled (Phase 3).
        </Alert>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, icon: Icon }) => (
            <Card key={label} className="p-5">
              <div className="flex items-center justify-between text-ink-muted">
                <p className="text-sm">{label}</p>
                <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <p className="mt-3 font-display text-3xl font-light text-ink-faint">—</p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
