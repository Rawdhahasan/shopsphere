import { Container, Skeleton } from "@/components/ui";

export default function StoreLoading() {
  return (
    <Container className="py-16" aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full" />
      <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </Container>
  );
}
