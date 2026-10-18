import { z } from "zod";

/**
 * Environment variables that are safe to expose to the browser.
 *
 * Next.js only inlines NEXT_PUBLIC_* values when they are referenced literally
 * (process.env.NEXT_PUBLIC_X), so each one is read by name below.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1)
    .refine((key) => !looksLikeSecretSupabaseKey(key), {
      message:
        "This looks like a Supabase SECRET key. Use the publishable/anon key here; the secret key belongs in SUPABASE_SECRET_KEY.",
    }),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

function readPublicEnv() {
  return {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

let cached: PublicEnv | undefined;

/** Validated public env. Throws a readable error if anything is missing or wrong. */
export function getPublicEnv(): PublicEnv {
  if (cached) return cached;
  const result = publicEnvSchema.safeParse(readPublicEnv());
  if (!result.success) {
    throw new Error(`Invalid public environment variables:\n${z.prettifyError(result.error)}`);
  }
  cached = result.data;
  return cached;
}

/** True when Supabase has been configured in .env.local (lets the app boot before Phase 2). */
export function isSupabaseConfigured(): boolean {
  return publicEnvSchema.safeParse(readPublicEnv()).success;
}

/**
 * Guards against pasting a secret key into a browser-exposed variable.
 * Detects new-style secret keys and legacy service_role JWTs.
 */
export function looksLikeSecretSupabaseKey(key: string): boolean {
  if (key.startsWith("sb_secret_")) return true;
  const parts = key.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}
