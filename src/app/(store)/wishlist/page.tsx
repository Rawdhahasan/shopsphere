import { Suspense } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { buttonVariants, Container, EmptyState, Eyebrow, Skeleton } from "@/components/ui";
import { ProductCard } from "@/features/catalog/components/product-card";
import { getProductCards } from "@/features/catalog/queries";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { getWishlistProductIds } from "@/features/wishlist/server";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <Container className="py-12 lg:py-16">
      <Eyebrow>Saved for later</Eyebrow>
      <h1 className="mt-3 text-4xl font-light sm:text-5xl">Wishlist</h1>
      <Suspense fallback={<WishlistSkeleton />}>
        <WishlistContent />
      </Suspense>
    </Container>
  );
}

async function WishlistContent() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <EmptyState
        className="mt-10"
        icon={Heart}
        title="Sign in to see your wishlist"
        description="Save pieces you love and come back to them on any device."
        action={
          <div className="flex gap-3">
            <Link href="/login?next=%2Fwishlist" className={buttonVariants()}>
              Sign in
            </Link>
            <Link
              href="/register?next=%2Fwishlist"
              className={buttonVariants({ variant: "secondary" })}
            >
              Create account
            </Link>
          </div>
        }
      />
    );
  }

  const products = await getProductCards(await getWishlistProductIds(user.id));
  if (products.length === 0) {
    return (
      <EmptyState
        className="mt-10"
        icon={Heart}
        title="Nothing saved yet"
        description="Tap “Save” on any product to keep it here."
        action={
          <Link href="/products" className={buttonVariants()}>
            Browse the collection
          </Link>
        }
      />
    );
  }

  return (
    <>
      <p className="mt-4 text-ink-muted">
        {products.length} saved {products.length === 1 ? "piece" : "pieces"}
      </p>
      <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <li key={product.id} className="flex flex-col gap-4">
            <ProductCard product={product} />
            <WishlistButton
              productId={product.id}
              productName={product.name}
              saved
              returnTo="/wishlist"
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function WishlistSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="aspect-[4/5] w-full" />
      ))}
    </div>
  );
}
