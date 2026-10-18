import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui";
import { signOut } from "@/features/auth/actions";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Shows "Access denied" instead of admin pages for non-admins. The role is
 * read from the database on every request.
 *
 * This is NOT sufficient on its own: Next.js renders layouts and pages in
 * parallel, so pages run even when this gate refuses. Every admin page, data
 * function and Server Action must call requireAdmin() itself (enforced by
 * tests/admin-pages-guard.test.ts).
 */
export async function AdminGate({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) return <AccessDenied />;
  return children;
}

function AccessDenied() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <ShieldAlert className="size-6" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-light">Access denied</h1>
      <p className="mt-3 max-w-sm text-sm text-ink-muted">
        The admin dashboard is only available to store administrators. You&apos;re signed in with a
        customer account.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/account" className={buttonVariants()}>
          Go to my account
        </Link>
        <form action={signOut}>
          <button type="submit" className={buttonVariants({ variant: "secondary" })}>
            Sign in as someone else
          </button>
        </form>
      </div>
    </div>
  );
}
