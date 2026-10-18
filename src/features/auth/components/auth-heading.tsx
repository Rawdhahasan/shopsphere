import type { ReactNode } from "react";

export function AuthHeading({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-light">{title}</h1>
      {description && <p className="mt-3 text-sm text-ink-muted">{description}</p>}
    </div>
  );
}

export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="space-y-5" aria-hidden="true">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-20 animate-pulse rounded bg-sand/70" />
          <div className="h-11 animate-pulse rounded-md bg-sand/70" />
        </div>
      ))}
      <div className="h-13 animate-pulse rounded-full bg-sand/70" />
    </div>
  );
}
