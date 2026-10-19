import type Stripe from "stripe";
import { releaseOrder, syncCheckoutSession } from "@/features/checkout/orders";
import { getServerEnv, isStripeConfigured, isStripeWebhookConfigured } from "@/lib/env/server";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook. Verifies the signature, ignores events it has already
 * processed (stripe_events), and keeps orders in step with payments:
 * completed sessions mark the order paid, expired ones return the stock.
 * Every handler is idempotent, so Stripe's automatic retries are safe.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured() || !isStripeWebhookConfigured()) {
    return new Response("Stripe webhook is not configured.", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature ?? "",
      getServerEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch {
    return new Response("Invalid signature.", { status: 400 });
  }

  const admin = createAdminClient();
  const { data: seen } = await admin
    .from("stripe_events")
    .select("processed_at")
    .eq("id", event.id)
    .maybeSingle();
  if (seen?.processed_at) return Response.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await syncCheckoutSession(event.data.object.id);
        break;
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const orderId = event.data.object.metadata?.order_id;
        if (orderId) await releaseOrder(orderId, "Stripe checkout expired");
        break;
      }
      default:
        break;
    }
  } catch {
    // Not recorded as processed, so Stripe retries later.
    return new Response("Processing failed.", { status: 500 });
  }

  await admin
    .from("stripe_events")
    .upsert({ id: event.id, type: event.type, processed_at: new Date().toISOString() });
  return Response.json({ received: true });
}
