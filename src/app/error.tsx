"use client";

import { useEffect } from "react";
import { Button, Eyebrow } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center"
    >
      <Eyebrow>Something went wrong</Eyebrow>
      <h1 className="mt-4 text-4xl font-light">We couldn’t load this page</h1>
      <p className="mt-4 max-w-md text-ink-muted">
        Please try again. If the problem continues, come back in a few minutes.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-ink-faint">Reference: {error.digest}</p>
      )}
      <Button className="mt-8" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
