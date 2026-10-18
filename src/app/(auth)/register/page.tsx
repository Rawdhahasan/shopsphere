import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "@/features/auth/actions";
import { RegisterForm } from "@/features/auth/components/auth-forms";
import { AuthFormSkeleton, AuthHeading } from "@/features/auth/components/auth-heading";

export const metadata: Metadata = { title: "Create an account" };

async function RegisterFormWithParams({
  searchParams,
}: Pick<PageProps<"/register">, "searchParams">) {
  const { next } = await searchParams;
  return <RegisterForm action={signUp} next={typeof next === "string" ? next : undefined} />;
}

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <>
      <AuthHeading
        title="Create your account"
        description={
          <>
            Already have one?{" "}
            <Link href="/login" className="font-medium text-ink underline underline-offset-4">
              Sign in
            </Link>
          </>
        }
      />
      <Suspense fallback={<AuthFormSkeleton fields={4} />}>
        <RegisterFormWithParams searchParams={searchParams} />
      </Suspense>
      <p className="mt-6 text-xs leading-relaxed text-ink-faint">
        By creating an account you agree to receive order and account emails. We never sell your
        data.
      </p>
    </>
  );
}
