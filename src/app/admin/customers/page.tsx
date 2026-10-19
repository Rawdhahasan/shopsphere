import { Suspense } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  AdminContent,
  AdminEmpty,
  AdminFilters,
  AdminTable,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import { Skeleton } from "@/components/ui";
import { listCustomers } from "@/features/admin/customers/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { formatOrderDate } from "@/lib/orders/status";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  if (!(await requireAdmin())) return null;
  return (
    <>
      <AdminPageHeader title="Customers" description="Everyone with a ShopSphere account." />
      <AdminContent>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <CustomerTable searchParams={searchParams} />
        </Suspense>
      </AdminContent>
    </>
  );
}

async function CustomerTable({
  searchParams,
}: Pick<PageProps<"/admin/customers">, "searchParams">) {
  const { q: raw } = await searchParams;
  const q = typeof raw === "string" ? raw : "";
  const customers = await listCustomers(q);
  if (!customers) return null;
  return (
    <>
      <AdminFilters action="/admin/customers" q={q} placeholder="Name or email" />
      {customers.length === 0 ? (
        <AdminEmpty>No customers match.</AdminEmpty>
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Joined</Th>
              <Th className="text-right">Orders</Th>
              <Th className="text-right">Spent</Th>
              <Th>Last order</Th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-subtle/40">
                <Td>
                  <Link href={`/admin/customers/${c.id}`} className="font-medium hover:underline">
                    {c.full_name ?? "No name"}
                  </Link>
                  <span className="block text-xs text-ink-muted">{c.email}</span>
                </Td>
                <Td className="text-ink-muted">{formatOrderDate(c.created_at)}</Td>
                <Td className="text-right tabular-nums">{c.orders}</Td>
                <Td className="text-right tabular-nums">{formatMoney(c.spent)}</Td>
                <Td className="text-ink-muted">{c.last ? formatOrderDate(c.last) : "—"}</Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </>
  );
}
