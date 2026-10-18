import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type { Database } from "@/types/database";
import { getPublicEnv } from "@/lib/env/public";

/**
 * Supabase client acting as the signed-in user (reads their session cookie).
 * Use it in Server Components, Server Actions and Route Handlers.
 * Row-Level Security applies, so queries only return what this user may see.
 *
 * Because it reads cookies, any component using it must render inside a
 * <Suspense> boundary (required by Cache Components).
 */
export async function createClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();
  // Session checks compare token expiry with the current time, which Cache Components
  // only allows at request time; connection() marks everything below as per-request.
  await connection();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot set cookies. That is fine: the proxy
            // refreshes the session cookie on every request.
          }
        },
      },
    },
  );
}
