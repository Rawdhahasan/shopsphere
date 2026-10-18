import Link from "next/link";
import { Leaf, RotateCcw, Truck } from "lucide-react";
import { buttonVariants, Container, Eyebrow } from "@/components/ui";
import { siteConfig } from "@/config/site";

const promises = [
  {
    icon: Leaf,
    title: "Thoughtfully made",
    body: "Natural materials and small-batch makers, chosen to last.",
  },
  {
    icon: Truck,
    title: "Free shipping over $150",
    body: "Carefully packed and tracked from our studio to your door.",
  },
  {
    icon: RotateCcw,
    title: "30-day returns",
    body: "Live with it first. If it isn't right, send it back.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden">
        <Container className="grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="animate-fade-up">
            <Eyebrow>New season · Autumn edit</Eyebrow>
            <h1 className="mt-5 text-5xl leading-[1.05] font-light sm:text-6xl lg:text-7xl">
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
                href="/categories/living"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Explore living
              </Link>
            </div>
          </div>

          {/* Editorial art panel. Real product photography arrives with the Phase 2 seed data. */}
          <div className="relative aspect-[4/5] animate-fade-up [animation-delay:120ms] sm:aspect-[5/4] lg:aspect-[4/5]">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-sand via-subtle to-accent-soft" />
            <div className="absolute top-[14%] left-[12%] h-[52%] w-[46%] rounded-t-full bg-surface shadow-lifted" />
            <div className="absolute right-[12%] bottom-[12%] size-[38%] rounded-full bg-accent/85 shadow-lifted" />
            <div className="absolute bottom-[12%] left-[12%] h-[10%] w-[50%] rounded-full bg-ink/85" />
          </div>
        </Container>
      </section>

      <section aria-labelledby="promises-heading" className="border-y border-line bg-surface">
        <h2 id="promises-heading" className="sr-only">
          Our promises
        </h2>
        <Container className="grid gap-10 py-14 md:grid-cols-3">
          {promises.map(({ icon: Icon, title, body }) => (
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
