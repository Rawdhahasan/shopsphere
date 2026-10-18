import { Suspense } from "react";
import { AccountIcon, AccountLink } from "@/components/layout/account-link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CartIcon, CartLink } from "@/features/cart/components/cart-link";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader
        account={
          <Suspense fallback={<AccountIcon />}>
            <AccountLink />
          </Suspense>
        }
        cart={
          <Suspense fallback={<CartIcon />}>
            <CartLink />
          </Suspense>
        }
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
