import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  AdminContent,
  AdminEmpty,
  AdminFilters,
  AdminTable,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import { Badge, buttonVariants, Skeleton } from "@/components/ui";
import { listAdminProducts, listCategoryChoices } from "@/features/admin/products/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Products" };

const STATUS_TONE = { active: "success", draft: "warning", archived: "neutral" } as const;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  if (!(await requireAdmin())) return null;
  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Create products, set prices and options, and manage photos."
        actions={
          <Link href="/admin/products/new" className={buttonVariants()}>
            <Plus className="size-4" aria-hidden="true" /> New product
          </Link>
        }
      />
      <AdminContent>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ProductsTable searchParams={searchParams} />
        </Suspense>
      </AdminContent>
    </>
  );
}

async function ProductsTable({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const category = typeof params.category === "string" ? params.category : "";
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  const [result, categories] = await Promise.all([
    listAdminProducts({ q, status, category, page }),
    listCategoryChoices(),
  ]);
  if (!result) return null;
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (category) sp.set("category", category);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return `/admin/products${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminFilters
        action="/admin/products"
        q={q}
        placeholder="Search by name"
        filters={[
          {
            name: "status",
            value: status,
            options: [
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
              { value: "archived", label: "Archived" },
            ],
          },
          {
            name: "category",
            value: category,
            options: [
              { value: "", label: "All rooms" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ],
          },
        ]}
      />
      {result.products.length === 0 ? (
        <AdminEmpty>No products match.</AdminEmpty>
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Room</Th>
              <Th>Status</Th>
              <Th>Variants</Th>
              <Th className="text-right">Price</Th>
              <Th className="text-right">Stock</Th>
            </tr>
          </thead>
          <tbody>
            {result.products.map((p) => (
              <tr key={p.id} className="hover:bg-subtle/40">
                <Td>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex items-center gap-3 font-medium hover:underline"
                  >
                    <span className="relative size-10 shrink-0 overflow-hidden rounded bg-subtle">
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <ImageOff
                          className="m-auto size-4 h-full text-ink-faint"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span>
                      {p.name}
                      {p.is_featured && (
                        <span className="ml-2 text-xs font-normal text-accent-strong">
                          Featured
                        </span>
                      )}
                    </span>
                  </Link>
                </Td>
                <Td className="text-ink-muted">
                  {(p.category as { name: string } | null)?.name ?? "—"}
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                </Td>
                <Td>{p.variantCount}</Td>
                <Td className="text-right tabular-nums">
                  {p.min_price_cents === null
                    ? "—"
                    : p.max_price_cents && p.max_price_cents > p.min_price_cents
                      ? `${formatMoney(p.min_price_cents)}–${formatMoney(p.max_price_cents)}`
                      : formatMoney(p.min_price_cents)}
                </Td>
                <Td className={cn("text-right tabular-nums", p.total_stock === 0 && "text-danger")}>
                  {p.total_stock}
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
      <div className="flex items-center justify-between text-sm text-ink-muted">
        <span>
          {result.total} {result.total === 1 ? "product" : "products"}
        </span>
        {result.pageCount > 1 && (
          <div className="flex gap-1">
            {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={pageHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded",
                  p === page ? "bg-ink text-canvas" : "hover:bg-subtle",
                )}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
