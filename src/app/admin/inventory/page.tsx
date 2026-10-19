import { Suspense } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  AdminCard,
  AdminContent,
  AdminEmpty,
  AdminFilters,
  AdminTable,
  dateTimeFormat,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import { Badge, Skeleton } from "@/components/ui";
import { adjustStock } from "@/features/admin/inventory/actions";
import { AdjustStockForm } from "@/features/admin/inventory/adjust-form";
import { listInventory, listRecentMovements } from "@/features/admin/inventory/queries";
import { requireAdmin } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Inventory" };

const REASON_LABEL: Record<string, string> = {
  initial: "Opening stock",
  restock: "Restock",
  adjustment: "Correction",
  reservation: "Order",
  reservation_release: "Checkout released",
  return: "Return / refund",
};

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  if (!(await requireAdmin())) return null;
  return (
    <>
      <AdminPageHeader
        title="Inventory"
        description="Stock for every variant for sale. Every change is logged."
      />
      <AdminContent>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <InventoryTable searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <Movements />
        </Suspense>
      </AdminContent>
    </>
  );
}

async function InventoryTable({
  searchParams,
}: Pick<PageProps<"/admin/inventory">, "searchParams">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const filter = typeof params.filter === "string" ? params.filter : "";
  const rows = await listInventory({ q, filter });
  if (!rows) return null;
  return (
    <>
      <AdminFilters
        action="/admin/inventory"
        q={q}
        placeholder="Product or SKU"
        filters={[
          {
            name: "filter",
            value: filter,
            options: [
              { value: "", label: "All stock" },
              { value: "low", label: "Low stock" },
              { value: "out", label: "Out of stock" },
            ],
          },
        ]}
      />
      {rows.length === 0 ? (
        <AdminEmpty>Nothing here. {filter ? "Everything is well stocked." : ""}</AdminEmpty>
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>SKU</Th>
              <Th className="text-right">In stock</Th>
              <Th>Adjust</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => {
              const out = v.stock_quantity === 0;
              const low = !out && v.stock_quantity <= v.low_stock_threshold;
              return (
                <tr key={v.id}>
                  <Td>
                    <Link
                      href={`/admin/products/${v.product!.id}`}
                      className="font-medium hover:underline"
                    >
                      {v.product!.name}
                    </Link>
                    {v.title !== "Default" && (
                      <span className="block text-xs text-ink-muted">{v.title}</span>
                    )}
                  </Td>
                  <Td className="font-mono text-xs">{v.sku}</Td>
                  <Td className="text-right">
                    <span
                      className={cn("tabular-nums", out && "text-danger", low && "text-warning")}
                    >
                      {v.stock_quantity}
                    </span>
                    {(out || low) && (
                      <Badge tone={out ? "danger" : "warning"} className="ml-2">
                        {out ? "Out" : "Low"}
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <AdjustStockForm
                      action={adjustStock.bind(null, v.id)}
                      label={`${v.product!.name} ${v.title}`}
                    />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}
    </>
  );
}

async function Movements() {
  const movements = await listRecentMovements();
  return (
    <AdminCard title="Recent stock changes">
      {movements.length === 0 ? (
        <p className="text-sm text-ink-muted">No stock changes yet.</p>
      ) : (
        <ul className="-my-2 divide-y divide-line text-sm">
          {movements.map((m) => {
            const variant = m.variant as {
              sku: string;
              title: string;
              product: { name: string } | null;
            } | null;
            const order = m.order as { order_number: string } | null;
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-2">
                <span
                  className={cn(
                    "w-14 font-medium tabular-nums",
                    m.quantity_change > 0 ? "text-success" : "text-danger",
                  )}
                >
                  {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                </span>
                <span className="min-w-0 flex-1">
                  {variant?.product?.name ?? "Deleted product"}
                  {variant && variant.title !== "Default" && (
                    <span className="text-ink-muted"> · {variant.title}</span>
                  )}
                </span>
                <span className="text-ink-muted">
                  {REASON_LABEL[m.reason] ?? m.reason}
                  {order ? (
                    <>
                      {" "}
                      <Link href={`/admin/orders/${order.order_number}`} className="underline">
                        {order.order_number}
                      </Link>
                    </>
                  ) : m.note ? (
                    ` · ${m.note}`
                  ) : null}
                </span>
                <span className="w-40 text-right text-xs text-ink-muted">
                  {dateTimeFormat.format(new Date(m.created_at))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </AdminCard>
  );
}
