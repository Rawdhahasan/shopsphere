import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminCard, AdminContent } from "@/components/admin/admin-ui";
import { Badge, Skeleton } from "@/components/ui";
import { countryName } from "@/config/countries";
import { getCustomer } from "@/features/admin/customers/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { formatOrderDate, ORDER_STATUS } from "@/lib/orders/status";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  if (!(await requireAdmin())) return null;
  return (
    <Suspense fallback={<Skeleton className="m-10 h-96" />}>
      <Customer params={params} />
    </Suspense>
  );
}

async function Customer({ params }: Pick<PageProps<"/admin/customers/[id]">, "params">) {
  const { id } = await params;
  const data = await getCustomer(id);
  if (!data) notFound();
  const { profile, addresses, orders } = data;
  const spent = orders
    .filter((o) => !["cancelled", "refunded"].includes(o.status))
    .reduce((sum, o) => sum + o.total_cents, 0);

  return (
    <>
      <AdminPageHeader
        title={profile.full_name ?? profile.email}
        description={`${profile.email} · joined ${formatOrderDate(profile.created_at)}`}
        actions={
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> All customers
          </Link>
        }
      />
      <AdminContent className="grid gap-6 space-y-0 lg:grid-cols-[1fr_20rem]">
        <AdminCard title={`Orders (${orders.length}) · ${formatMoney(spent)} spent`}>
          {orders.length === 0 ? (
            <p className="text-sm text-ink-muted">No orders yet.</p>
          ) : (
            <ul className="-my-2 divide-y divide-line text-sm">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-2">
                  <Link
                    href={`/admin/orders/${o.order_number}`}
                    className="font-medium hover:underline"
                  >
                    {o.order_number}
                  </Link>
                  <span className="flex-1 text-ink-muted">{formatOrderDate(o.created_at)}</span>
                  <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                  <span className="w-24 text-right tabular-nums">
                    {formatMoney(o.total_cents, o.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
        <div className="space-y-6">
          <AdminCard title="Contact">
            <p className="text-sm">{profile.email}</p>
            <p className="text-sm text-ink-muted">{profile.phone ?? "No phone number"}</p>
          </AdminCard>
          <AdminCard title="Addresses">
            {addresses.length === 0 ? (
              <p className="text-sm text-ink-muted">No saved addresses.</p>
            ) : (
              <ul className="space-y-4 text-sm">
                {addresses.map((a) => (
                  <li key={a.id}>
                    <p className="font-medium">
                      {a.label ?? a.full_name}
                      {a.is_default && (
                        <span className="ml-2 text-xs font-normal text-ink-muted">Default</span>
                      )}
                    </p>
                    <p className="text-ink-muted">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city}
                      {a.region ? `, ${a.region}` : ""} {a.postal_code},{" "}
                      {countryName(a.country_code)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      </AdminContent>
    </>
  );
}
