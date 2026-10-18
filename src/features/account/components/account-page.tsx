import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui";

export function AccountPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-light sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

export function AccountSectionSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
