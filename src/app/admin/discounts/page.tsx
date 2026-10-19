import { Suspense } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  AdminCard,
  AdminContent,
  AdminEmpty,
  AdminTable,
  Td,
  Th,
} from "@/components/admin/admin-ui";
import { Alert, Badge, Skeleton } from "@/components/ui";
import { saveDiscount, setDiscountActive } from "@/features/admin/discounts/actions";
import { DiscountForm, type DiscountDefaults } from "@/features/admin/discounts/discount-form";
import {
  discountState,
  listDiscounts,
  type DiscountState,
} from "@/features/admin/discounts/queries";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Discounts" };

const STATE_BADGE: Record<
  DiscountState,
  { label: string; tone: "success" | "warning" | "neutral" | "danger" }
> = {
  active: { label: "Active", tone: "success" },
  scheduled: { label: "Scheduled", tone: "warning" },
  expired: { label: "Expired", tone: "neutral" },
  "used-up": { label: "Used up", tone: "neutral" },
  paused: { label: "Paused", tone: "danger" },
};

const toLocalInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export default async function DiscountsPage({ searchParams }: PageProps<"/admin/discounts">) {
  if (!(await requireAdmin())) return null;
  return (
    <>
      <AdminPageHeader title="Discounts" description="Codes shoppers can enter at checkout." />
      <AdminContent>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <Discounts searchParams={searchParams} />
        </Suspense>
      </AdminContent>
    </>
  );
}

async function Discounts({ searchParams }: Pick<PageProps<"/admin/discounts">, "searchParams">) {
  const params = await searchParams;
  const codes = await listDiscounts();
  if (!codes) return null;
  const editing =
    typeof params.edit === "string" ? codes.find((c) => c.id === params.edit) : undefined;
  const defaults: DiscountDefaults = editing
    ? {
        code: editing.code,
        description: editing.description ?? "",
        type: editing.type,
        value:
          editing.type === "percentage" ? String(editing.value) : (editing.value / 100).toFixed(2),
        minSubtotal: editing.min_subtotal_cents
          ? (editing.min_subtotal_cents / 100).toFixed(2)
          : "",
        maxRedemptions: editing.max_redemptions ? String(editing.max_redemptions) : "",
        startsAt: toLocalInput(editing.starts_at),
        endsAt: toLocalInput(editing.ends_at),
        active: editing.is_active,
      }
    : {
        code: "",
        description: "",
        type: "percentage",
        value: "",
        minSubtotal: "",
        maxRedemptions: "",
        startsAt: "",
        endsAt: "",
        active: true,
      };

  return (
    <>
      {params.saved === "1" && <Alert tone="success">Discount code saved.</Alert>}
      {codes.length === 0 ? (
        <AdminEmpty>No discount codes yet.</AdminEmpty>
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Minimum</Th>
              <Th>Used</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => {
              const state = discountState(code);
              return (
                <tr key={code.id}>
                  <Td>
                    <span className="font-mono font-medium">{code.code}</span>
                    {code.description && (
                      <span className="block text-xs text-ink-muted">{code.description}</span>
                    )}
                  </Td>
                  <Td>
                    {code.type === "percentage"
                      ? `${code.value}% off`
                      : `${formatMoney(code.value)} off`}
                  </Td>
                  <Td>{code.min_subtotal_cents ? formatMoney(code.min_subtotal_cents) : "—"}</Td>
                  <Td className="tabular-nums">
                    {code.redemption_count}
                    {code.max_redemptions ? ` / ${code.max_redemptions}` : ""}
                  </Td>
                  <Td>
                    <Badge tone={STATE_BADGE[state].tone}>{STATE_BADGE[state].label}</Badge>
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <Link
                      href={`/admin/discounts?edit=${code.id}#discount-form`}
                      className="mr-4 text-sm underline underline-offset-4"
                    >
                      Edit
                    </Link>
                    <form
                      action={setDiscountActive.bind(null, code.id, !code.is_active)}
                      className="inline"
                    >
                      <button
                        type="submit"
                        className="text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
                      >
                        {code.is_active ? "Pause" : "Resume"}
                      </button>
                    </form>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </AdminTable>
      )}
      <div id="discount-form" className="scroll-mt-6">
        <AdminCard
          title={editing ? `Edit ${editing.code}` : "New discount code"}
          actions={
            editing ? (
              <Link href="/admin/discounts" className="text-sm text-ink-muted underline">
                Cancel
              </Link>
            ) : undefined
          }
        >
          <DiscountForm
            key={editing?.id ?? "new"}
            action={saveDiscount.bind(null, editing?.id ?? null)}
            defaults={defaults}
            submitLabel={editing ? "Save changes" : "Create code"}
          />
        </AdminCard>
      </div>
    </>
  );
}
