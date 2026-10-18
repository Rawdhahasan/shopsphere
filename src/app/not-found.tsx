import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants, Eyebrow } from "@/components/ui";

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center"
    >
      <Logo className="mb-12" />
      <Eyebrow>Error 404</Eyebrow>
      <h1 className="mt-4 text-4xl font-light sm:text-5xl">This page has moved on</h1>
      <p className="mt-4 max-w-md text-ink-muted">
        The page you’re looking for doesn’t exist or is no longer available.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className={buttonVariants()}>
          Back to home
        </Link>
        <Link href="/products" className={buttonVariants({ variant: "secondary" })}>
          Browse products
        </Link>
      </div>
    </main>
  );
}
