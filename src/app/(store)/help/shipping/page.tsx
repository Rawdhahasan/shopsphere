import Link from "next/link";
import { PackageCheck, RotateCcw, Truck } from "lucide-react";
import { Container, Eyebrow } from "@/components/ui";
import { getStoreSettings } from "@/features/store/settings";
import { formatMoney } from "@/lib/money";

export const metadata = {
  title: "Shipping & returns",
  description: "Delivery times, shipping costs and our 30-day returns policy.",
};

export default async function ShippingPage() {
  const settings = await getStoreSettings();
  const free = settings.freeShippingThresholdCents;
  return (
    <Container className="max-w-3xl py-12 lg:py-20">
      <Eyebrow>Help</Eyebrow>
      <h1 className="mt-3 text-4xl font-light sm:text-5xl">Shipping &amp; returns</h1>
      <p className="mt-4 text-ink-muted">
        Everything you need to know about getting your order, and sending it back if it isn’t right.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Truck,
            title:
              free === null
                ? `${formatMoney(settings.flatShippingCents)} shipping`
                : `Free over ${formatMoney(free)}`,
            body:
              free === null
                ? "One flat rate on every order."
                : `Otherwise a flat ${formatMoney(settings.flatShippingCents)}.`,
          },
          {
            icon: PackageCheck,
            title: "3–7 business days",
            body: "Tracked delivery on every order.",
          },
          {
            icon: RotateCcw,
            title: "30-day returns",
            body: "On unused pieces in their original packaging.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-lg border border-line bg-surface p-5">
            <Icon className="size-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <p className="mt-3 font-medium">{title}</p>
            <p className="mt-1 text-sm text-ink-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 space-y-10 leading-relaxed text-ink-soft">
        <section>
          <h2 className="text-2xl font-light text-ink">Delivery</h2>
          <p className="mt-3">
            Orders are packed within one to two business days. Smaller pieces arrive in three to
            five business days; furniture can take up to seven. When your order ships you’ll find
            the carrier and tracking number on your{" "}
            <Link href="/account/orders" className="underline underline-offset-4">
              order page
            </Link>
            .
          </p>
          <p className="mt-3">
            {free === null
              ? `Shipping is a flat ${formatMoney(settings.flatShippingCents)} per order.`
              : `Shipping is free on orders of ${formatMoney(free)} or more after discounts, and a flat ${formatMoney(settings.flatShippingCents)} otherwise.`}
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-light text-ink">Returns</h2>
          <p className="mt-3">
            Live with it first. If a piece isn’t right, you can return it within 30 days of
            delivery, unused and in its original packaging. Contact us with your order number and
            we’ll send a prepaid label.
          </p>
          <p className="mt-3">
            Refunds go back to your original payment method within five business days of the return
            reaching us. Made-to-order furniture can’t be returned unless it arrives damaged.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-light text-ink">Damaged or missing items</h2>
          <p className="mt-3">
            Tell us within seven days of delivery and include a photo. We’ll replace the item or
            refund you in full, whichever you prefer.
          </p>
        </section>
      </div>

      <p className="mt-14 rounded-md bg-subtle p-4 text-sm text-ink-muted">
        ShopSphere is a portfolio demo store. Orders are placed in test mode and nothing is shipped.
      </p>
    </Container>
  );
}
