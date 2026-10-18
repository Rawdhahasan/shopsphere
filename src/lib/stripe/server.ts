import "server-only";
import Stripe from "stripe";
import { getServerEnv } from "@/lib/env/server";

let stripe: Stripe | undefined;

/** Server-side Stripe client. The env check guarantees a TEST-mode key. */
export function getStripe(): Stripe {
  stripe ??= new Stripe(getServerEnv("STRIPE_SECRET_KEY"), {
    appInfo: { name: "ShopSphere" },
    typescript: true,
  });
  return stripe;
}
