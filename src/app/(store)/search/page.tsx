import { Suspense } from "react";
import { Container, Eyebrow } from "@/components/ui";
import { parseFilters } from "@/features/catalog/filters";
import {
  ProductListing,
  ProductListingSkeleton,
} from "@/features/catalog/components/product-listing";

export const metadata = { title: "Search", robots: { index: false } };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <Container className="py-12 lg:py-16">
      <header className="mb-10">
        <Eyebrow>Search</Eyebrow>
        <h1 className="mt-3 text-4xl font-light sm:text-5xl">Find something for home</h1>
      </header>
      <Suspense fallback={<ProductListingSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const filters = parseFilters(await searchParams);
  return <ProductListing filters={filters} basePath="/search" autoFocusSearch={!filters.q} />;
}
