import "server-only";
import { z } from "zod";

/**
 * Server-only secrets. The `server-only` import makes the build fail if any
 * Client Component ever imports this file, so these values cannot leak into
 * browser JavaScript.
 */
const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z
    .string()
    .regex(/^(sk|rk)_test_/, "ShopSphere only runs in Stripe TEST mode: use an sk_test_ key."),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates one secret on first use, so a page that never touches Stripe
 * still works before Stripe is configured.
 */
export function getServerEnv<K extends keyof ServerEnv>(key: K): ServerEnv[K] {
  const result = serverEnvSchema.shape[key].safeParse(process.env[key]);
  if (!result.success) {
    throw new Error(
      `Invalid or missing server environment variable ${key}: ${result.error.issues[0]?.message}`,
    );
  }
  return result.data as ServerEnv[K];
}

/**
 * True when a Stripe TEST key is configured. Without one, checkout runs in a
 * clearly labelled demo mode that places orders without taking payment.
 */
export function isStripeConfigured(): boolean {
  return serverEnvSchema.shape.STRIPE_SECRET_KEY.safeParse(process.env.STRIPE_SECRET_KEY).success;
}

export function isStripeWebhookConfigured(): boolean {
  return serverEnvSchema.shape.STRIPE_WEBHOOK_SECRET.safeParse(process.env.STRIPE_WEBHOOK_SECRET)
    .success;
}
