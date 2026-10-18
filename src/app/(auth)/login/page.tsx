import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "@/features/auth/actions";
import { LoginForm } from "@/features/auth/components/auth-forms";
import { AuthFormSkeleton, AuthHeading } from "@/features/auth/components/auth-heading";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  link: "That link has expired or was already used. Please sign in, or request a new link.",
};

async function LoginFormWithParams({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const error = typeof params.error === "string" ? NOTICES[params.error] : undefined;
  return <LoginForm action={signIn} next={next} notice={error} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <AuthHeading
        title="Welcome back"
        description={
          <>
            New to ShopSphere?{" "}
            <Link href="/register" className="font-medium text-ink underline underline-offset-4">
              Create an account
            </Link>
          </>
        }
      />
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </>
  );
}
