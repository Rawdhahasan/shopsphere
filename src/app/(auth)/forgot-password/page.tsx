import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/features/auth/actions";
import { ForgotPasswordForm } from "@/features/auth/components/auth-forms";
import { AuthHeading } from "@/features/auth/components/auth-heading";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        title="Reset your password"
        description="Enter the email you signed up with and we'll send you a link to choose a new password."
      />
      <ForgotPasswordForm action={requestPasswordReset} />
      <p className="mt-6 text-sm text-ink-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
