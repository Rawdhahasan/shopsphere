import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { mergeGuestCartIntoAccount } from "@/features/cart/server";
import { safeRedirectPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/**
 * Landing point for links in Supabase emails (confirm sign-up, reset password).
 * Supports both link styles Supabase can send:
 *   ?code=…                    (PKCE, the default for @supabase/ssr)
 *   ?token_hash=…&type=…       (custom email templates)
 * On success the session cookie is set and the user continues to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get("next"), "/account");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  if (ok) {
    const { data } = await supabase.auth.getUser();
    if (data.user) await mergeGuestCartIntoAccount(data.user.id, supabase);
  }

  return NextResponse.redirect(new URL(ok ? next : "/login?error=link", origin));
}
