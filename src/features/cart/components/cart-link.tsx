import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCartCount } from "../server";

const iconLink =
  "relative inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle";

/** Header cart icon without a count, used while the count loads. */
export function CartIcon() {
  return (
    <Link href="/cart" className={iconLink} aria-label="Cart">
      <ShoppingBag className="size-5" strokeWidth={1.75} />
    </Link>
  );
}

/** Header cart icon with the number of items. Reads cookies, so render inside <Suspense>. */
export async function CartLink() {
  const count = await getCartCount();
  return (
    <Link
      href="/cart"
      className={iconLink}
      aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
    >
      <ShoppingBag className="size-5" strokeWidth={1.75} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] leading-4.5 font-semibold text-white tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
