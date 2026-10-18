import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Container, Skeleton } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { Breadcrumbs } from "@/features/catalog/components/breadcrumbs";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { ProductReviews } from "@/features/catalog/components/product-reviews";
import { ProductView } from "@/features/catalog/components/product-view";
import { RatingStars } from "@/features/catalog/components/rating-stars";
import {
  getProduct,
  getProductReviews,
  getRelatedProducts,
  type ProductDetail,
} from "@/features/catalog/queries";

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  const description = product.seoDescription ?? product.shortDescription ?? undefined;
  return {
    title: product.seoTitle ?? product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.image ? [{ url: product.image.url, alt: product.image.alt }] : undefined,
    },
  };
}

export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent {...props} />
    </Suspense>
  );
}

async function ProductContent({ params }: PageProps<"/products/[slug]">) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const [reviews, related] = await Promise.all([
    getProductReviews(product.id),
    getRelatedProducts(product.id, product.categoryId),
  ]);

  return (
    <>
      <ProductJsonLd product={product} />
      <Container className="py-8 lg:py-12">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            product.categorySlug && product.categoryName
              ? { label: product.categoryName, href: `/categories/${product.categorySlug}` }
              : { label: "Shop", href: "/products" },
            { label: product.name },
          ]}
        />

        <div className="mt-6">
          <ProductView
            name={product.name}
            images={product.images}
            options={product.options}
            variants={product.variants}
            header={
              <>
                {product.brand && (
                  <p className="text-xs font-medium tracking-[0.18em] text-ink-muted uppercase">
                    {product.brand}
                  </p>
                )}
                <h1 className="mt-3 text-4xl leading-tight font-light sm:text-5xl">
                  {product.name}
                </h1>
                {product.reviewCount > 0 && (
                  <Link href="#reviews" className="mt-4 inline-flex hover:opacity-80">
                    <RatingStars rating={product.rating} count={product.reviewCount} />
                  </Link>
                )}
              </>
            }
            details={
              product.shortDescription && (
                <p className="mt-6 max-w-prose leading-relaxed text-ink-soft">
                  {product.shortDescription}
                </p>
              )
            }
          />
        </div>

        <ul className="mt-12 grid gap-4 border-y border-line py-6 text-sm sm:grid-cols-3">
          <li className="flex items-center gap-3">
            <Truck className="size-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            {siteConfig.announcement}
          </li>
          <li className="flex items-center gap-3">
            <RotateCcw className="size-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            30-day returns on unused pieces
          </li>
          <li className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            Secure checkout with Stripe
          </li>
        </ul>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          {product.description && (
            <section aria-labelledby="details-heading">
              <h2 id="details-heading" className="text-3xl font-light">
                The details
              </h2>
              <div className="mt-6 space-y-4 leading-relaxed text-ink-soft">
                {product.description.split(/\n{2,}/).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}
          {product.specifications.length > 0 && (
            <section aria-labelledby="specs-heading">
              <h2 id="specs-heading" className="text-3xl font-light">
                Specifications
              </h2>
              <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
                {product.specifications.map((spec) => (
                  <div key={spec.label} className="grid grid-cols-[8rem_1fr] gap-4 py-3">
                    <dt className="text-ink-muted">{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <div className="mt-20">
          <ProductReviews reviews={reviews} rating={product.rating} count={product.reviewCount} />
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-24">
            <h2 id="related-heading" className="mb-8 text-3xl font-light">
              You may also like
            </h2>
            <ProductGrid products={related} />
          </section>
        )}
      </Container>
    </>
  );
}

/** Product structured data, so search engines can show price, stock and rating. */
function ProductJsonLd({ product }: { product: ProductDetail }) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? undefined,
    image: product.images.map((i) => i.url),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    sku: product.variants[0]?.sku,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: (product.priceCents / 100).toFixed(2),
      highPrice: (product.maxPriceCents / 100).toFixed(2),
      offerCount: product.variants.length,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${site}/products/${product.slug}`,
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviewCount,
          }
        : undefined,
  };
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped can't break out of the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function ProductSkeleton() {
  return (
    <Container className="py-8 lg:py-12" aria-busy="true">
      <span className="sr-only" role="status">
        Loading product…
      </span>
      <Skeleton className="h-3 w-48" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="space-y-4 lg:pt-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-13 w-full rounded-full" />
        </div>
      </div>
    </Container>
  );
}
