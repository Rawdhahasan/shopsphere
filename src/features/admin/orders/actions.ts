"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { requireAdmin } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/env/server";
import { errorState, parseForm, type FormState } from "@/lib/forms/form-state";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const shipSchema = z.object({
  carrier: z.string().trim().min(2, "Enter the carrier.").max(60),
  trackingNumber: z
    .string()
    .trim()
    .min(4, "Enter the tracking number.")
    .max(100)
    .regex(/^[A-Za-z0-9 -]+$/, "Use letters, numbers, spaces and dashes only."),
});

/**
 * Moves an order to the next fulfilment step. The admin's own client is used,
 * so the guard_order_update trigger enforces the allowed transitions.
 */
export async function advanceOrder(
  orderId: string,
  next: "processing" | "shipped" | "delivered",
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireAdmin())) return errorState("Only admins can update orders.");
  if (!z.uuid().safeParse(orderId).success) return errorState("Unknown order.");

  let tracking: { tracking_carrier: string; tracking_number: string } | undefined;
  if (next === "shipped") {
    const parsed = parseForm(shipSchema, formData);
    if (!parsed.success) return parsed.state;
    tracking = {
      tracking_carrier: parsed.data.carrier,
      tracking_number: parsed.data.trackingNumber.toUpperCase(),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: next, ...tracking })
    .eq("id", orderId);
  if (error) {
    return errorState(
      error.message.includes("Invalid order status change")
        ? "That step isn't allowed from the order's current status."
        : "The order couldn't be updated. Please try again.",
    );
  }
  refresh();
  return { status: "success", message: `Order marked as ${next}.` };
}

/**
 * Refunds an order that hasn't shipped. With Stripe connected the payment is
 * refunded on Stripe first; demo and seed orders are refunded in the database
 * only. refund_order() returns the stock.
 */
export async function refundOrder(
  orderId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireAdmin())) return errorState("Only admins can refund orders.");
  if (!z.uuid().safeParse(orderId).success) return errorState("Unknown order.");
  if (formData.get("confirm") !== "REFUND") return errorState("Type REFUND to confirm.");

  const service = createAdminClient();
  const { data: order } = await service
    .from("orders")
    .select("status, stripe_payment_intent_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || !["paid", "processing"].includes(order.status)) {
    return errorState("Only paid orders that haven't shipped can be refunded.");
  }

  const intent = order.stripe_payment_intent_id;
  if (intent && !intent.startsWith("pi_test_seed_") && isStripeConfigured()) {
    try {
      await getStripe().refunds.create({ payment_intent: intent });
    } catch {
      return errorState("Stripe couldn't refund this payment. Nothing was changed.");
    }
  }

  const { error } = await service.rpc("refund_order", {
    p_order_id: orderId,
    p_note: "Refunded by an admin",
  });
  if (error) return errorState("The refund was recorded on Stripe but not here. Please retry.");
  updateTag(CATALOG_TAG);
  refresh();
  return { status: "success", message: "Order refunded and its items returned to stock." };
}
