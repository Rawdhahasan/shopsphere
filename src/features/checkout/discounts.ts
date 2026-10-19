import "server-only";
import type { DiscountRule } from "@/lib/pricing/calculate-totals";
import { formatMoney } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";

export type AppliedDiscount = {
  id: string;
  code: string;
  description: string | null;
  rule: DiscountRule;
};

export type DiscountResult =
  { ok: true; discount: AppliedDiscount } | { ok: false; message: string };

/** Normalises what a shopper typed: "  welcome10 " → "WELCOME10". */
export function normalizeCode(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toUpperCase().slice(0, 32) : "";
}

/**
 * Checks a discount code against the database. Codes are admin-only data
 * (RLS), so this uses the privileged client and returns only what the
 * shopper needs to see.
 */
export async function findDiscount(
  rawCode: string,
  subtotalCents: number,
): Promise<DiscountResult> {
  const code = normalizeCode(rawCode);
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return { ok: false, message: "That code isn't valid." };

  const { data } = await createAdminClient()
    .from("discount_codes")
    .select(
      "id, code, description, type, value, min_subtotal_cents, max_redemptions, redemption_count, starts_at, ends_at, is_active",
    )
    .eq("code", code)
    .maybeSingle();

  const now = Date.now();
  if (!data || !data.is_active) return { ok: false, message: "That code isn't valid." };
  if (data.starts_at && new Date(data.starts_at).getTime() > now) {
    return { ok: false, message: "That code isn't active yet." };
  }
  if (data.ends_at && new Date(data.ends_at).getTime() <= now) {
    return { ok: false, message: "That code has expired." };
  }
  if (data.max_redemptions !== null && data.redemption_count >= data.max_redemptions) {
    return { ok: false, message: "That code has already been used up." };
  }
  if (subtotalCents < data.min_subtotal_cents) {
    return {
      ok: false,
      message: `Spend ${formatMoney(data.min_subtotal_cents)} or more to use this code.`,
    };
  }
  return {
    ok: true,
    discount: {
      id: data.id,
      code: data.code,
      description: data.description,
      rule: { type: data.type, value: data.value, minSubtotalCents: data.min_subtotal_cents },
    },
  };
}
