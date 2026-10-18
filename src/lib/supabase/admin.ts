import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getPublicEnv } from "@/lib/env/public";
import { getServerEnv } from "@/lib/env/server";

/**
 * Privileged Supabase client using the SECRET key. It BYPASSES Row-Level Security.
 *
 * Only use it for trusted server work that has no user session (the Stripe
 * webhook, seed scripts), or after the caller has been verified as an admin.
 * Never pass its results to the browser without filtering them first.
 */
export function createAdminClient() {
  return createClient<Database>(
    getPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv("SUPABASE_SECRET_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );
}
