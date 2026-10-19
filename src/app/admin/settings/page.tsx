import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminContent } from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";
import { saveSettings } from "@/features/admin/settings/actions";
import { SettingsForm } from "@/features/admin/settings/settings-form";
import { requireAdmin } from "@/lib/auth/session";
import { isStripeConfigured, isStripeWebhookConfigured } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  if (!(await requireAdmin())) return null;
  return (
    <>
      <AdminPageHeader title="Settings" description="Store details, shipping and tax." />
      <AdminContent>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <Settings />
        </Suspense>
      </AdminContent>
    </>
  );
}

async function Settings() {
  if (!(await requireAdmin())) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  const money = (cents: number | null | undefined) =>
    cents == null ? "" : (cents / 100).toFixed(2);
  return (
    <>
      <AdminCard>
        <SettingsForm
          action={saveSettings}
          defaults={{
            storeName: data?.store_name ?? "ShopSphere",
            supportEmail: data?.support_email ?? "",
            announcement: data?.announcement_text ?? "",
            flatShipping: money(data?.flat_shipping_cents ?? 1200),
            freeThreshold: money(data?.free_shipping_threshold_cents),
            taxRate: String((data?.tax_rate_bps ?? 0) / 100),
          }}
        />
      </AdminCard>
      <AdminCard title="Payments">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">Stripe</dt>
            <dd>
              {isStripeConfigured()
                ? "Connected (test mode)"
                : "Not connected: checkout runs in demo mode"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Stripe webhook</dt>
            <dd>
              {isStripeWebhookConfigured()
                ? "Configured"
                : "Not configured: payments are confirmed when shoppers return"}
            </dd>
          </div>
        </dl>
      </AdminCard>
    </>
  );
}
