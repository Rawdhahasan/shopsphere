import "server-only";
import { isStripeConfigured } from "@/lib/env/server";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Order lifecycle helpers for trusted server code (checkout, the Stripe
 * webhook and the success page). They use the privileged client because
 * customers can't create or pay for orders themselves (RLS).
 */

/** Stripe Checkout sessions must live at least 30 minutes. */
export const CHECKOUT_SESSION_MINUTES = 30;
/** Stock stays reserved a little longer than the session, then is released. */
export const RESERVATION_MINUTES = CHECKOUT_SESSION_MINUTES + 5;

type PendingOrder = {
  id: string;
  total_cents: number;
  stripe_checkout_session_id: string | null;
};

export async function markOrderPaid(
  orderId: string,
  sessionId?: string | null,
  paymentIntentId?: string | null,
) {
  const { data, error } = await createAdminClient().rpc("mark_order_paid", {
    p_order_id: orderId,
    p_checkout_session_id: sessionId ?? undefined,
    p_payment_intent_id: paymentIntentId ?? undefined,
  });
  if (error) throw new Error(`Couldn't mark order paid: ${error.message}`);
  return data;
}

export async function releaseOrder(orderId: string, note: string) {
  const { error } = await createAdminClient().rpc("release_order", {
    p_order_id: orderId,
    p_note: note,
  });
  if (error) throw new Error(`Couldn't release order: ${error.message}`);
}

/**
 * Settles one unpaid order: if Stripe says it was paid (the webhook may not
 * have arrived yet) it's marked paid; otherwise its session is closed and the
 * stock is returned.
 */
async function settlePendingOrder(order: PendingOrder, note: string) {
  if (order.stripe_checkout_session_id && isStripeConfigured()) {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
    if (session.payment_status === "paid" && session.amount_total === order.total_cents) {
      const intent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      await markOrderPaid(order.id, session.id, intent);
      return;
    }
    if (session.status === "open") {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
    }
  }
  await releaseOrder(order.id, note);
}

/** Before a shopper starts a new checkout, their earlier unpaid orders give their stock back. */
export async function settlePendingOrdersFor(userId: string) {
  const { data } = await createAdminClient()
    .from("orders")
    .select("id, total_cents, stripe_checkout_session_id")
    .eq("user_id", userId)
    .eq("status", "pending_payment");
  for (const order of data ?? []) await settlePendingOrder(order, "Replaced by a new checkout");
}

/** Releases stock held by checkouts that were abandoned. Safe to call often. */
export async function sweepExpiredOrders() {
  const { data } = await createAdminClient()
    .from("orders")
    .select("id, total_cents, stripe_checkout_session_id")
    .eq("status", "pending_payment")
    .lt("reservation_expires_at", new Date().toISOString())
    .limit(25);
  for (const order of data ?? []) {
    await settlePendingOrder(order, "Checkout expired").catch(() => undefined);
  }
}

/**
 * Called when Stripe sends the shopper back. Confirms the payment with
 * Stripe directly, so orders are correct even before the webhook arrives.
 * Returns the order number, or null if the session doesn't belong to an order.
 */
export async function syncCheckoutSession(sessionId: string): Promise<string | null> {
  if (!isStripeConfigured() || !/^cs_test_[A-Za-z0-9]+$/.test(sessionId)) return null;
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const orderId = session.metadata?.order_id;
  if (!orderId) return null;

  const { data: order } = await createAdminClient()
    .from("orders")
    .select("id, order_number, total_cents, stripe_checkout_session_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.stripe_checkout_session_id !== session.id) return null;

  if (session.payment_status === "paid" && session.amount_total === order.total_cents) {
    const intent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    await markOrderPaid(order.id, session.id, intent);
  }
  return order.order_number;
}
