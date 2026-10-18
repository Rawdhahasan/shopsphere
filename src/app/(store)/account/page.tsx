import { Suspense } from "react";
import Link from "next/link";
import { MapPin, Package } from "lucide-react";
import { Badge, buttonVariants, Card, EmptyState } from "@/components/ui";
import { countryName } from "@/config/countries";
import {
  AccountPageHeader,
  AccountSectionSkeleton,
} from "@/features/account/components/account-page";
import { getCurrentProfile, requireUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { formatOrderDate, ORDER_STATUS } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Overview" };

async function Overview() {
  await requireUser("/account");
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: orders }, { data: address }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, total_cents, currency, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("addresses").select("*").eq("is_default", true).maybeSingle(),
  ]);

  const firstName = profile?.fullName?.split(" ")[0];

  return (
    <>
      <AccountPageHeader
        title={firstName ? `Hello, ${firstName}` : "Hello"}
        description={profile?.email}
      />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-sm font-medium">Recent orders</h2>
            <Link
              href="/account/orders"
              className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
            >
              View all
            </Link>
          </div>
          {orders && orders.length > 0 ? (
            <ul className="mt-4 divide-y divide-line">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div>
                    <Link
                      href={`/account/orders/${order.order_number}`}
                      className="font-medium hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <p className="text-sm text-ink-muted">{formatOrderDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge tone={ORDER_STATUS[order.status].tone}>
                      {ORDER_STATUS[order.status].label}
                    </Badge>
                    <span className="w-20 text-right text-sm font-medium">
                      {formatMoney(order.total_cents, order.currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="When you place an order, you'll be able to track it here."
              action={
                <Link href="/products" className={buttonVariants({ variant: "secondary" })}>
                  Browse products
                </Link>
              }
              className="py-10"
            />
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-sans text-sm font-medium">Default shipping address</h2>
          {address ? (
            <address className="mt-4 text-sm leading-relaxed text-ink-soft not-italic">
              {address.full_name}
              <br />
              {address.line1}
              {address.line2 && (
                <>
                  <br />
                  {address.line2}
                </>
              )}
              <br />
              {[address.city, address.region, address.postal_code].filter(Boolean).join(", ")}
              <br />
              {countryName(address.country_code)}
            </address>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
              <MapPin className="size-4" aria-hidden="true" /> No address saved yet.
            </p>
          )}
          <Link
            href="/account/addresses"
            className={buttonVariants({ variant: "link", className: "mt-5 text-sm" })}
          >
            Manage addresses
          </Link>
        </Card>
      </div>
    </>
  );
}

export default function AccountOverviewPage() {
  return (
    <Suspense fallback={<AccountSectionSkeleton />}>
      <Overview />
    </Suspense>
  );
}
