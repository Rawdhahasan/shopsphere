import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Container, Eyebrow } from "@/components/ui";
import { signOut } from "@/features/auth/actions";
import { AccountNav } from "@/features/account/components/account-nav";

export const metadata: Metadata = {
  title: { default: "My account", template: "%s · My account · ShopSphere" },
  robots: { index: false },
};

/** Every page inside checks the session itself (see requireUser); this shell is static. */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <Container className="py-12 lg:py-16">
      <Eyebrow>My account</Eyebrow>
      <div className="mt-6 grid gap-10 lg:grid-cols-[13rem_1fr] lg:gap-14">
        <aside className="space-y-4 lg:border-r lg:border-line lg:pr-6">
          <AccountNav />
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-subtle/60 hover:text-ink"
            >
              <LogOut className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
