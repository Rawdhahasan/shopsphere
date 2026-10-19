import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, RotateCcw, Truck } from "lucide-react";
import { buttonVariants, Container, Eyebrow } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { ProductGrid } from "@/features/catalog/components/product-card";
import { getFeaturedProducts, listCategories } from "@/features/catalog/queries";
import { getStoreSettings, shippingPromise } from "@/features/store/settings";
import { publicStorageUrl } from "@/lib/supabase/storage";

const promises = (shipping: string) => [
  {
    icon: Leaf,
    title: "Thoughtfully made",
    body: "Natural materials and small-batch makers, chosen to last.",
  },
  {
    icon: Truck,
    title: shipping,
    body: "Carefully packed and tracked from our studio to your door.",
  },
  {
    icon: RotateCcw,
    title: "30-day returns",
    body: "Live with it first. If it isn't right, send it back.",
  },
];

export default async function HomePage() {
  const [featured, categories, settings] = await Promise.all([
    getFeaturedProducts(8),
    listCategories(),
    getStoreSettings(),
  ]);
  const heroImage = publicStorageUrl("category-images", "categories/living.webp");
  const storyImage = publicStorageUrl("category-images", "categories/kitchen-dining.webp");

  return (
    <>
      <section className="overflow-hidden">
        <Container className="grid items-center gap-12 py-14 lg:grid-cols-[1fr_1.05fr] lg:py-20">
          <div className="animate-fade-up">
            <Eyebrow>New season · Autumn edit</Eyebrow>
            <h1 className="mt-5 text-5xl leading-[1.04] font-light sm:text-6xl lg:text-7xl">
              {siteConfig.tagline}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-muted">
              Furniture, tableware and textiles in honest materials, designed to feel at home for
              years.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/products" className={buttonVariants({ size: "lg" })}>
                Shop the collection
              </Link>
              <Link
                href="/products?on_sale=1"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Shop the sale
              </Link>
            </div>
            <dl className="mt-12 flex gap-10 text-sm">
              <div>
                <dt className="text-ink-muted">Pieces</dt>
                <dd className="mt-1 font-display text-2xl font-light">
                  {categories.reduce((sum, c) => sum + c.productCount, 0) || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Rooms</dt>
                <dd className="mt-1 font-display text-2xl font-light">
                  {categories.length || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Returns</dt>
                <dd className="mt-1 font-display text-2xl font-light">30 days</dd>
              </div>
            </dl>
          </div>

          <div className="relative aspect-[4/5] animate-fade-up overflow-hidden rounded-lg bg-subtle [animation-delay:120ms] sm:aspect-[5/4] lg:aspect-[4/5]">
            {heroImage ? (
              <Image
                src={heroImage}
                alt="A calm living room with a linen sofa, oak side table and soft daylight"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-sand via-subtle to-accent-soft" />
            )}
            {featured[0] && (
              <Link
                href={`/products/${featured[0].slug}`}
                className="absolute right-4 bottom-4 left-4 flex items-center gap-4 rounded-md bg-surface/95 p-3 shadow-lifted backdrop-blur transition hover:bg-surface sm:right-auto sm:max-w-xs"
              >
                {featured[0].image && (
                  <span className="relative size-14 shrink-0 overflow-hidden rounded bg-subtle">
                    <Image
                      src={featured[0].image.url}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>
                )}
                <span className="min-w-0 text-sm">
                  <span className="block text-xs text-ink-muted">Featured</span>
                  <span className="block truncate font-medium">{featured[0].name}</span>
                </span>
                <ArrowRight className="ml-auto size-4 shrink-0" aria-hidden="true" />
              </Link>
            )}
          </div>
        </Container>
      </section>

      {categories.length > 0 && (
        <section aria-labelledby="rooms-heading" className="py-16 lg:py-20">
          <Container>
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <Eyebrow>Shop by room</Eyebrow>
                <h2 id="rooms-heading" className="mt-3 text-3xl font-light sm:text-4xl">
                  Find your corner
                </h2>
              </div>
              <Link
                href="/products"
                className="hidden text-sm underline-offset-4 hover:underline sm:block"
              >
                View everything
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {categories.map((category, i) => (
                <li key={category.id} className={i === 0 ? "col-span-2 md:col-span-1" : undefined}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-lg bg-subtle"
                  >
                    {category.imageUrl && (
                      <Image
                        src={category.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/5 to-transparent" />
                    <span className="absolute inset-x-4 bottom-4 text-canvas">
                      <span className="block font-display text-xl font-light">{category.name}</span>
                      <span className="text-xs opacity-80">{category.productCount} pieces</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="border-t border-line py-16 lg:py-20">
          <Container>
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <Eyebrow>The autumn edit</Eyebrow>
                <h2 id="featured-heading" className="mt-3 text-3xl font-light sm:text-4xl">
                  Pieces we love right now
                </h2>
              </div>
              <Link
                href="/products"
                className={buttonVariants({
                  variant: "secondary",
                  className: "hidden sm:inline-flex",
                })}
              >
                Shop all
              </Link>
            </div>
            <ProductGrid products={featured} />
          </Container>
        </section>
      )}

      <section className="bg-subtle">
        <Container className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-20 lg:py-24">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-sand">
            {storyImage && (
              <Image
                src={storyImage}
                alt="Stoneware plates and linen napkins on a wooden table"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            )}
          </div>
          <div>
            <Eyebrow>Our materials</Eyebrow>
            <h2 className="mt-3 text-3xl leading-tight font-light sm:text-4xl">
              Oak, linen, stoneware and wool, chosen to age well.
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-ink-muted">
              We work with small studios that favour natural, repairable materials over trends.
              Every piece is picked to be used daily and to look better for it.
            </p>
            <Link href="/products?sort=newest" className={buttonVariants({ className: "mt-8" })}>
              See new arrivals
            </Link>
          </div>
        </Container>
      </section>

      <section aria-labelledby="promises-heading" className="border-b border-line bg-surface">
        <h2 id="promises-heading" className="sr-only">
          Our promises
        </h2>
        <Container className="grid gap-10 py-14 md:grid-cols-3">
          {promises(shippingPromise(settings)).map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <Icon
                className="mt-1 size-5 shrink-0 text-accent"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div>
                <h3 className="font-sans text-sm font-medium">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
