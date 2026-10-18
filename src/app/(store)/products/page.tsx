import { Suspense } from "react";
import { Container, Eyebrow } from "@/components/ui";
import { parseFilters } from "@/features/catalog/filters";
import {
  ProductListing,
  ProductListingSkeleton,
} from "@/features/catalog/components/product-listing";

export const metadata = {
  title: "Shop all",
  description: "Furniture, lighting, tableware, textiles and decor in natural materials.",
};

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <Container className="py-12 lg:py-16">
      <header className="mb-10 max-w-2xl">
        <Eyebrow>The collection</Eyebrow>
        <h1 className="mt-3 text-4xl font-light sm:text-5xl">Shop all</h1>
        <p className="mt-4 text-ink-muted">
          Furniture, lighting, tableware and textiles in honest materials, made to be lived with.
        </p>
      </header>
      <Suspense fallback={<ProductListingSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/products">, "searchParams">) {
  const filters = parseFilters(await searchParams);
  return <ProductListing filters={filters} basePath="/products" />;
}
