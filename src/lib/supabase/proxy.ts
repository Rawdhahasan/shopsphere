import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isGuestOnlyPath, isProtectedPath, safeRedirectPath } from "@/lib/auth/routes";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env/public";

/**
 * Runs before every page request:
 * 1. Refreshes the Supabase session cookie, so logins don't silently expire.
 * 2. Sends signed-out visitors away from protected pages (a fast first check;
 *    pages and Server Actions still verify the user themselves).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Before Supabase is configured (Phase 1), let every request through.
  if (!isSupabaseConfigured()) return response;

  const env = getPublicEnv();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // getClaims() verifies the token's signature; never trust getSession() on the server.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!isSignedIn && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return redirectWithCookies(loginUrl, response);
  }

  if (isSignedIn && isGuestOnlyPath(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = safeRedirectPath(request.nextUrl.searchParams.get("next"), "/account");
    target.search = "";
    return redirectWithCookies(target, response);
  }

  return response;
}

/** Redirects while keeping any refreshed session cookies. */
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  from.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "location") redirect.headers.set(key, value);
  });
  return redirect;
}
