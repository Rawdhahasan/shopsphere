import Link from "next/link";
import { Clock, Mail, MessageCircle } from "lucide-react";
import { Container, Eyebrow } from "@/components/ui";
import { getStoreSettings } from "@/features/store/settings";

export const metadata = { title: "Contact", description: "How to reach the ShopSphere team." };

const FAQ = [
  {
    q: "Where is my order?",
    a: "Your order page shows its status and, once shipped, the carrier and tracking number.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "Get in touch as soon as possible. We can change or cancel an order until it has shipped.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes, to the countries listed at checkout. Delivery times vary by destination.",
  },
  {
    q: "How do I care for linen and wood?",
    a: "Every product page lists care instructions under Specifications.",
  },
];

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const email = settings.supportEmail ?? "hello@shopsphere.example";
  return (
    <Container className="max-w-3xl py-12 lg:py-20">
      <Eyebrow>Help</Eyebrow>
      <h1 className="mt-3 text-4xl font-light sm:text-5xl">Contact us</h1>
      <p className="mt-4 text-ink-muted">We’re a small team and we read every message.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <a
          href={`mailto:${email}`}
          className="rounded-lg border border-line bg-surface p-5 transition-colors hover:border-ink"
        >
          <Mail className="size-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-3 font-medium">Email</p>
          <p className="mt-1 text-sm break-all text-ink-muted">{email}</p>
        </a>
        <div className="rounded-lg border border-line bg-surface p-5">
          <Clock className="size-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-3 font-medium">Hours</p>
          <p className="mt-1 text-sm text-ink-muted">Monday to Friday, 9:00–17:00 CET</p>
        </div>
        <Link
          href="/account/orders"
          className="rounded-lg border border-line bg-surface p-5 transition-colors hover:border-ink"
        >
          <MessageCircle className="size-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-3 font-medium">About an order?</p>
          <p className="mt-1 text-sm text-ink-muted">
            Have your order number ready (e.g. SS-100023).
          </p>
        </Link>
      </div>

      <h2 className="mt-16 text-2xl font-light">Common questions</h2>
      <div className="mt-6 divide-y divide-line border-y border-line">
        {FAQ.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
              {item.q}
              <span
                className="text-ink-muted transition-transform group-open:rotate-45"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </Container>
  );
}
