import "server-only";
import { getCart, type Cart } from "@/features/cart/server";
import { requireUser } from "@/lib/auth/session";
import { calculateOrderTotals, type OrderTotals } from "@/lib/pricing/calculate-totals";
import { createClient } from "@/lib/supabase/server";
import { findDiscount, normalizeCode, type AppliedDiscount } from "./discounts";

export type CheckoutAddress = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
};

export type CheckoutSummary = {
  user: { id: string; email: string };
  cart: Cart;
  addresses: CheckoutAddress[];
  discount: AppliedDiscount | null;
  discountError: string | null;
  code: string;
  totals: OrderTotals | null;
};

/** Everything checkout needs, priced on the server from database values. */
export async function getCheckoutSummary(rawCode?: string): Promise<CheckoutSummary> {
  const user = await requireUser("/checkout");
  const supabase = await createClient();
  const [cart, { data: addressRows }] = await Promise.all([
    getCart(),
    supabase
      .from("addresses")
      .select(
        "id, label, full_name, phone, line1, line2, city, region, postal_code, country_code, is_default",
      )
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at"),
  ]);

  const subtotalCents = cart.subtotalCents;
  const code = normalizeCode(rawCode);
  let discount: AppliedDiscount | null = null;
  let discountError: string | null = null;
  if (code && cart.items.length > 0) {
    const result = await findDiscount(code, subtotalCents);
    if (result.ok) discount = result.discount;
    else discountError = result.message;
  }

  const totals =
    cart.items.length > 0
      ? calculateOrderTotals({
          lines: cart.items.map((i) => ({
            unitPriceCents: i.unitPriceCents,
            quantity: i.quantity,
          })),
          discount: discount?.rule ?? null,
          shipping: {
            flatCents: cart.shipping.flatCents,
            freeThresholdCents: cart.shipping.freeThresholdCents,
          },
          taxRateBps: cart.shipping.taxRateBps,
        })
      : null;

  return {
    user,
    cart,
    addresses: (addressRows ?? []).map((a) => ({
      id: a.id,
      label: a.label,
      fullName: a.full_name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      region: a.region,
      postalCode: a.postal_code,
      countryCode: a.country_code,
      isDefault: a.is_default,
    })),
    discount,
    discountError,
    code,
    totals,
  };
}
