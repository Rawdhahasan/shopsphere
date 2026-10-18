import { Suspense } from "react";
import { Alert } from "@/components/ui";
import { updatePassword } from "@/features/auth/actions";
import { UpdatePasswordForm } from "@/features/auth/components/auth-forms";
import {
  AccountPageHeader,
  AccountSectionSkeleton,
} from "@/features/account/components/account-page";
import { requireUser } from "@/lib/auth/session";

export const metadata = { title: "Password" };

async function PasswordSection({
  searchParams,
}: Pick<PageProps<"/account/password">, "searchParams">) {
  await requireUser("/account/password");
  const { reset } = await searchParams;
  return (
    <div className="space-y-6">
      {reset === "1" && (
        <Alert tone="info" title="Choose a new password">
          You followed a password reset link. Set a new password below to finish.
        </Alert>
      )}
      <UpdatePasswordForm action={updatePassword} />
    </div>
  );
}

export default function PasswordPage({ searchParams }: PageProps<"/account/password">) {
  return (
    <>
      <AccountPageHeader
        title="Password"
        description="Use a password you don't use anywhere else."
      />
      <Suspense fallback={<AccountSectionSkeleton />}>
        <PasswordSection searchParams={searchParams} />
      </Suspense>
    </>
  );
}
