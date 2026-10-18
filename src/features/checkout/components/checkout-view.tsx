"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ImageOff, Lock, MapPin, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui";
import { FormAlert } from "@/components/forms/form-alert";
import { countryName } from "@/config/countries";
import { formatMoney } from "@/lib/money";
import { initialFormState, type FormState } from "@/lib/forms/form-state";
import { cn } from "@/lib/utils/cn";
import type { OrderTotals } from "@/lib/pricing/calculate-totals";

type Address = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
};

type Item = {
  variantId: string;
  productName: string;
  variantTitle: string | null;
  quantity: number;
  unitPriceCents: number;
  imageUrl: string | null;
  imageAlt: string;
};

export function CheckoutView({
  action,
  email,
  addresses,
  items,
  totals,
  code,
  discountLabel,
  discountError,
  stripe,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  email: string;
  addresses: Address[];
  items: Item[];
  totals: OrderTotals;
  code: string;
  discountLabel: string | null;
  discountError: string | null;
  /** false = demo mode (no Stripe key yet) */
  stripe: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
      <div className="space-y-10">
        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="font-sans text-base font-medium">
            Contact
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Order updates go to <span className="text-ink">{email}</span>
          </p>
        </section>

        <form id="checkout-form" action={formAction} noValidate>
          <FormAlert state={state} />
          <input type="hidden" name="code" value={code} />
          <fieldset className="mt-4">
            <legend className="font-sans text-base font-medium">Delivery address</legend>
            {addresses.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-line-strong p-6 text-sm">
                <p className="text-ink-muted">Add an address to deliver your order to.</p>
                <Link
                  href="/account/addresses/new?next=%2Fcheckout"
                  className="mt-4 inline-flex items-center gap-2 font-medium underline underline-offset-4"
                >
                  <Plus className="size-4" aria-hidden="true" /> Add an address
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {addresses.map((address) => (
                  <label
                    key={address.id}
                    className="group relative flex cursor-pointer gap-3 rounded-lg border border-line-strong bg-surface p-4 text-sm transition-colors has-[:checked]:border-ink has-[:checked]:ring-1 has-[:checked]:ring-ink"
                  >
                    <input
                      type="radio"
                      name="addressId"
                      value={address.id}
                      defaultChecked={address.id === defaultAddress?.id}
                      className="peer sr-only"
                    />
                    <MapPin className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {address.label ?? address.fullName}
                        {address.isDefault && (
                          <span className="ml-2 text-xs font-normal text-ink-muted">Default</span>
                        )}
                      </span>
                      <span className="mt-1 block leading-relaxed text-ink-muted">
                        {address.fullName}
                        <br />
                        {address.line1}
                        {address.line2 && `, ${address.line2}`}
                        <br />
                        {address.city}
                        {address.region && `, ${address.region}`} {address.postalCode}
                        <br />
                        {countryName(address.countryCode)}
                      </span>
                    </span>
                    <Check
                      className="absolute top-4 right-4 size-4 text-ink opacity-0 peer-checked:opacity-100"
                      aria-hidden="true"
                    />
                  </label>
                ))}
                <Link
                  href="/account/addresses/new?next=%2Fcheckout"
                  className="flex min-h-28 items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong p-4 text-sm text-ink-muted hover:border-ink hover:text-ink"
                >
                  <Plus className="size-4" aria-hidden="true" /> Add a new address
                </Link>
              </div>
            )}
          </fieldset>
        </form>

        <section aria-labelledby="payment-heading">
          <h2 id="payment-heading" className="font-sans text-base font-medium">
            Payment
          </h2>
          {stripe ? (
            <div className="mt-3 rounded-lg border border-line bg-surface p-4 text-sm text-ink-muted">
              <p>
                You’ll pay on Stripe’s secure checkout page. Card details never reach ShopSphere.
              </p>
              <p className="mt-2 text-xs">
                Test mode: use card <span className="font-mono text-ink">4242 4242 4242 4242</span>,
                any future date and any CVC.
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-warning/30 bg-warning-soft p-4 text-sm text-warning">
              <p className="font-medium">Demo checkout</p>
              <p className="mt-1 text-ink-soft">
                Stripe isn’t connected yet, so no card is needed and nothing is charged. Your order
                is placed straight away so you can try the rest of the store.
              </p>
            </div>
          )}
        </section>
      </div>

      <aside
        aria-label="Order summary"
        className="h-fit rounded-lg border border-line bg-surface p-6 lg:sticky lg:top-28"
      >
        <h2 className="font-sans text-base font-medium">Order summary</h2>
        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.variantId} className="flex gap-3 text-sm">
              <span className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded bg-subtle">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <ImageOff className="m-auto size-4 h-full text-ink-faint" aria-hidden="true" />
                )}
                <span className="absolute -top-0 right-0 rounded-bl bg-ink px-1.5 text-[0.65rem] leading-5 text-canvas">
                  {item.quantity}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.productName}</span>
                {item.variantTitle && (
                  <span className="block truncate text-xs text-ink-muted">{item.variantTitle}</span>
                )}
              </span>
              <span className="tabular-nums">
                {formatMoney(item.unitPriceCents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <form method="get" action="/checkout" className="mt-6 flex gap-2">
          <label htmlFor="discount-code" className="sr-only">
            Discount code
          </label>
          <div className="relative flex-1">
            <Tag
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <input
              id="discount-code"
              name="code"
              defaultValue={code}
              placeholder="Discount code"
              autoCapitalize="characters"
              maxLength={32}
              className="h-11 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-sm uppercase placeholder:text-ink-faint placeholder:normal-case focus-visible:border-ink focus-visible:outline-none"
            />
          </div>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
        {discountError && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {discountError}
          </p>
        )}
        {discountLabel && (
          <p className="mt-2 flex items-center justify-between text-xs text-success">
            <span>{discountLabel}</span>
            <Link href="/checkout" className="text-ink-muted underline underline-offset-4">
              Remove
            </Link>
          </p>
        )}

        <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
          <Row label="Subtotal" value={formatMoney(totals.subtotalCents)} />
          {totals.discountCents > 0 && (
            <Row label="Discount" value={`−${formatMoney(totals.discountCents)}`} tone="success" />
          )}
          <Row
            label="Shipping"
            value={totals.shippingCents === 0 ? "Free" : formatMoney(totals.shippingCents)}
          />
          {totals.taxCents > 0 && <Row label="Tax" value={formatMoney(totals.taxCents)} />}
          <div className="flex justify-between border-t border-line pt-4 text-base font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(totals.totalCents)}</dd>
          </div>
        </dl>

        <Button
          type="submit"
          form="checkout-form"
          size="lg"
          className="mt-6 w-full"
          loading={pending}
          disabled={addresses.length === 0}
        >
          {!pending && <Lock className="size-4" aria-hidden="true" />}
          {stripe
            ? `Pay ${formatMoney(totals.totalCents)}`
            : `Place order · ${formatMoney(totals.totalCents)}`}
        </Button>
        <p className="mt-3 text-center text-xs text-ink-muted">
          {stripe ? "Secured by Stripe · test mode" : "Demo order · nothing is charged"}
        </p>
      </aside>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className={cn("tabular-nums", tone === "success" && "text-success")}>{value}</dd>
    </div>
  );
}
