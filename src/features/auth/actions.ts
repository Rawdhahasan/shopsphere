"use server";

import { redirect } from "next/navigation";
import { mergeGuestCartIntoAccount } from "@/features/cart/server";
import { safeRedirectPath } from "@/lib/auth/routes";
import { requireUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env/public";
import { errorState, parseForm, type FormState } from "@/lib/forms/form-state";
import { createClient } from "@/lib/supabase/server";
import {
  passwordResetRequestSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth";

/**
 * Authentication Server Actions. Each one validates its input with Zod on the
 * server, talks to Supabase Auth, and returns a FormState for the form to show.
 * Messages never reveal whether an email address has an account.
 */

function callbackUrl(next: string) {
  const site = getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  return `${site}/auth/callback?next=${encodeURIComponent(next)}`;
}

function friendlyAuthError(code: string | undefined, fallback: string): string {
  switch (code) {
    case "weak_password":
      return "That password is too easy to guess. Try a longer one with mixed characters.";
    case "same_password":
      return "Your new password must be different from the current one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
    default:
      return fallback;
  }
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(signInSchema, formData);
  if (!parsed.success) return parsed.state;
  const { email, password, next } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return errorState(
        "Please confirm your email address first. Check your inbox for the link.",
        formData,
      );
    }
    return errorState(friendlyAuthError(error.code, "Incorrect email or password."), formData);
  }

  // Keep anything the shopper added before signing in.
  await mergeGuestCartIntoAccount(data.user.id, supabase);
  redirect(safeRedirectPath(next, "/account"));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(signUpSchema, formData);
  if (!parsed.success) return parsed.state;
  const { fullName, email, password, next } = parsed.data;
  const destination = safeRedirectPath(next, "/account");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: callbackUrl(destination) },
  });
  if (error && error.code !== "user_already_exists") {
    return errorState(
      friendlyAuthError(error.code, "We couldn't create your account. Please try again."),
      formData,
    );
  }

  // Email confirmation off: Supabase signs the user in straight away.
  if (data.session && data.user) {
    await mergeGuestCartIntoAccount(data.user.id, supabase);
    redirect(destination);
  }

  // Confirmation on (or the address is already registered): same message either
  // way, so the form can't be used to discover who has an account.
  return {
    status: "success",
    message: `We've sent a confirmation link to ${email}. Open it to finish creating your account.`,
  };
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(passwordResetRequestSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl("/account/password?reset=1"),
  });
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return errorState(friendlyAuthError(error.code, ""), formData);
  }

  return {
    status: "success",
    message: `If an account exists for ${parsed.data.email}, a link to reset your password is on its way.`,
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser("/account/password");
  const parsed = parseForm(updatePasswordSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return errorState(
      friendlyAuthError(error.code, "We couldn't update your password. Please try again."),
    );
  }
  return { status: "success", message: "Your password has been updated." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
