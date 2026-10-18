import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container, Eyebrow, Skeleton } from "@/components/ui";
import { Breadcrumbs } from "@/features/catalog/components/breadcrumbs";
import {
  ProductListing,
  ProductListingSkeleton,
} from "@/features/catalog/components/product-listing";
import { parseFilters } from "@/features/catalog/filters";
import { getCategory } from "@/features/catalog/queries";

export async function generateMetadata({
  params,
}: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return { title: "Category not found" };
  return { title: category.name, description: category.description ?? undefined };
}

export default function CategoryPage(props: PageProps<"/categories/[slug]">) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategoryContent {...props} />
    </Suspense>
  );
}

async function CategoryContent({ params, searchParams }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const filters = parseFilters(await searchParams, { category: category.slug });

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-subtle">
        {category.imageUrl && (
          <Image
            src={category.imageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-90"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/85 to-canvas/10" />
        <Container className="relative py-16 lg:py-24">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/products" },
              { label: category.name },
            ]}
          />
          <Eyebrow className="mt-8">Category</Eyebrow>
          <h1 className="mt-3 text-4xl font-light sm:text-6xl">{category.name}</h1>
          {category.description && (
            <p className="mt-4 max-w-md text-ink-soft">{category.description}</p>
          )}
        </Container>
      </section>
      <Container className="py-12 lg:py-16">
        <ProductListing
          filters={filters}
          basePath={`/categories/${category.slug}`}
          fixedCategory={category.slug}
        />
      </Container>
    </>
  );
}

function CategorySkeleton() {
  return (
    <>
      <div className="border-b border-line bg-subtle">
        <Container className="py-16 lg:py-24">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-8 h-12 w-64" />
          <Skeleton className="mt-4 h-4 w-80 max-w-full" />
        </Container>
      </div>
      <Container className="py-12 lg:py-16">
        <ProductListingSkeleton />
      </Container>
    </>
  );
}
