"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env/public";
import { isStripeConfigured } from "@/lib/env/server";
import { errorState, type FormState } from "@/lib/forms/form-state";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { productImagePathFromUrl } from "./image-path";
import {
  CHECKOUT_SESSION_MINUTES,
  markOrderPaid,
  releaseOrder,
  RESERVATION_MINUTES,
  settlePendingOrdersFor,
  sweepExpiredOrders,
} from "./orders";
import { getCheckoutSummary } from "./summary";

function friendlyReserveError(message: string, items: { sku: string; productName: string }[]) {
  const sku = message.split(":")[1];
  const name = items.find((i) => i.sku === sku)?.productName ?? "An item in your cart";
  if (message.startsWith("OUT_OF_STOCK")) {
    return `${name} just sold out in the quantity you asked for. Please update your cart.`;
  }
  if (message.startsWith("PRICE_CHANGED")) {
    return `The price of ${name} just changed. Please review your cart before paying.`;
  }
  if (message.startsWith("UNAVAILABLE")) {
    return "An item in your cart is no longer available. Please review your cart.";
  }
  return "We couldn't place your order. Please try again.";
}

/**
 * Places an order from the signed-in shopper's cart. Everything is checked
 * again on the server: address ownership, discount code, prices and stock
 * (reserved atomically by reserve_order). The browser only sends an address
 * id and the code it wants to use.
 */
export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/checkout");
  const addressId = z.uuid().safeParse(formData.get("addressId"));
  if (!addressId.success) return errorState("Choose a delivery address.");

  const summary = await getCheckoutSummary(String(formData.get("code") ?? ""));
  const { cart, totals, discount } = summary;
  if (!totals || cart.items.length === 0) return errorState("Your cart is empty.");
  if (cart.items.some((i) => i.overStock)) {
    return errorState("Some items aren't available in that quantity. Please update your cart.");
  }
  if (summary.code && !discount)
    return errorState(summary.discountError ?? "That code isn't valid.");
  const address = summary.addresses.find((a) => a.id === addressId.data);
  if (!address) return errorState("Choose a delivery address.");

  // Give back stock from this shopper's earlier unpaid checkouts, and from abandoned ones.
  await settlePendingOrdersFor(user.id);
  await sweepExpiredOrders();

  const admin = createAdminClient();
  const { data: reserved, error } = await admin.rpc("reserve_order", {
    p_user_id: user.id,
    p_email: user.email,
    p_lines: cart.items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price_cents: item.unitPriceCents,
      image_path: productImagePathFromUrl(item.imageUrl),
    })),
    p_subtotal_cents: totals.subtotalCents,
    p_discount_cents: totals.discountCents,
    p_shipping_cents: totals.shippingCents,
    p_tax_cents: totals.taxCents,
    p_total_cents: totals.totalCents,
    // Generated types don't mark these optional, but the function accepts null (no code used).
    p_discount_code_id: (discount?.id ?? null) as string,
    p_discount_code: (discount?.code ?? null) as string,
    p_shipping_address: {
      full_name: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      region: address.region,
      postal_code: address.postalCode,
      country_code: address.countryCode,
    },
    p_reservation_expires_at: new Date(Date.now() + RESERVATION_MINUTES * 60_000).toISOString(),
  });
  const order = reserved?.[0];
  if (error || !order) return errorState(friendlyReserveError(error?.message ?? "", cart.items));
  // Stock changed: product pages show fresh availability on the next visit.
  updateTag(CATALOG_TAG);

  // Demo mode: no Stripe key yet, so the order is confirmed without taking payment.
  if (!isStripeConfigured()) {
    await markOrderPaid(order.order_id);
    redirect(`/checkout/success?order=${encodeURIComponent(order.order_number)}`);
  }

  let checkoutUrl: string | null = null;
  try {
    const stripe = getStripe();
    const site = getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    const coupon =
      totals.discountCents > 0
        ? await stripe.coupons.create({
            amount_off: totals.discountCents,
            currency: "usd",
            duration: "once",
            max_redemptions: 1,
            name: discount?.code ?? "Discount",
          })
        : null;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: order.order_id,
      metadata: { order_id: order.order_id, order_number: order.order_number },
      payment_intent_data: {
        metadata: { order_id: order.order_id, order_number: order.order_number },
      },
      line_items: [
        ...cart.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "usd",
            unit_amount: item.unitPriceCents,
            product_data: {
              name: item.productName,
              ...(item.variantTitle ? { description: item.variantTitle } : {}),
              ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
            },
          },
        })),
        ...(totals.taxCents > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "usd",
                  unit_amount: totals.taxCents,
                  product_data: { name: "Sales tax" },
                },
              },
            ]
          : []),
      ],
      ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: totals.shippingCents === 0 ? "Free shipping" : "Standard shipping",
            fixed_amount: { amount: totals.shippingCents, currency: "usd" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + (CHECKOUT_SESSION_MINUTES + 1) * 60,
      success_url: `${site}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/checkout?cancelled=1`,
    });

    const { error: linkError } = await admin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.order_id);
    if (linkError) throw new Error(linkError.message);
    checkoutUrl = session.url;
  } catch {
    await releaseOrder(order.order_id, "Payment could not be started").catch(() => undefined);
    return errorState("We couldn't start the payment. Please try again in a moment.");
  }

  if (!checkoutUrl) return errorState("We couldn't start the payment. Please try again.");
  redirect(checkoutUrl);
}
