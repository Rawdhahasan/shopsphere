import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/**
 * Data Access Layer for authentication.
 *
 * Every page, layout and Server Action that needs the current user goes
 * through these helpers, so the rules live in one place. Results are cached
 * per request with React `cache`, so calling them repeatedly is cheap.
 *
 * Because they read cookies, components calling them must render inside a
 * <Suspense> boundary (Cache Components).
 */

export type SessionUser = { id: string; email: string };

export type CurrentProfile = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: Database["public"]["Enums"]["user_role"];
};

/** The signed-in user, verified from the session token's signature. `null` when signed out. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
});

/**
 * The signed-in user's profile, read from the database. The role comes from
 * here (not from the session token), so an admin who is demoted loses access
 * immediately.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role")
    .eq("id", user.id)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    phone: data.phone,
    role: data.role,
  };
});

/** Redirects to the login page (and back afterwards) when nobody is signed in. */
export async function requireUser(returnTo = "/account"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/**
 * For admin pages and admin Server Actions. Signed-out visitors are sent to
 * the login page; signed-in non-admins get `null`, so the caller can show an
 * "access denied" message or refuse the action.
 */
export async function requireAdmin(returnTo = "/admin"): Promise<CurrentProfile | null> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return profile.role === "admin" ? profile : null;
}
