"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FormAlert } from "@/components/forms/form-alert";
import { Button, buttonVariants, FormField, Input, Select } from "@/components/ui";
import { SHIPPING_COUNTRIES } from "@/config/countries";
import type { FormAction } from "@/features/auth/components/auth-forms";
import type { FormState } from "@/lib/forms/form-state";

export type AddressDefaults = {
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
};

export const emptyAddress: AddressDefaults = {
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  countryCode: "US",
  isDefault: false,
};

export function AddressForm({
  action,
  defaults,
  submitLabel,
  returnTo,
}: {
  action: FormAction;
  defaults: AddressDefaults;
  submitLabel: string;
  /** Where to go after saving, e.g. back to checkout. Only "/checkout" is honoured. */
  returnTo?: "/checkout";
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {
    status: "idle",
  });
  const errors = state.fieldErrors ?? {};
  // After a failed submit, show what the user typed rather than the saved values.
  const v = (key: keyof AddressDefaults) => state.values?.[key] ?? String(defaults[key] ?? "");

  return (
    <form action={formAction} className="max-w-2xl space-y-5" noValidate>
      <FormAlert state={state} />
      {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full name" error={errors.fullName}>
          <Input name="fullName" autoComplete="name" required defaultValue={v("fullName")} />
        </FormField>
        <FormField label="Phone (optional)" error={errors.phone}>
          <Input name="phone" type="tel" autoComplete="tel" defaultValue={v("phone")} />
        </FormField>
      </div>
      <FormField label="Street address" error={errors.line1}>
        <Input name="line1" autoComplete="address-line1" required defaultValue={v("line1")} />
      </FormField>
      <FormField label="Apartment, suite, etc. (optional)" error={errors.line2}>
        <Input name="line2" autoComplete="address-line2" defaultValue={v("line2")} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-3">
        <FormField label="City" error={errors.city}>
          <Input name="city" autoComplete="address-level2" required defaultValue={v("city")} />
        </FormField>
        <FormField label="State / region" error={errors.region}>
          <Input name="region" autoComplete="address-level1" defaultValue={v("region")} />
        </FormField>
        <FormField label="Postal code" error={errors.postalCode}>
          <Input
            name="postalCode"
            autoComplete="postal-code"
            required
            defaultValue={v("postalCode")}
          />
        </FormField>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Country" error={errors.countryCode}>
          <Select
            name="countryCode"
            autoComplete="country"
            required
            defaultValue={v("countryCode")}
          >
            {SHIPPING_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Label (optional)" hint="For example Home or Work." error={errors.label}>
          <Input name="label" defaultValue={v("label")} />
        </FormField>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={state.values ? state.values.isDefault === "on" : defaults.isDefault}
          className="size-4 accent-ink"
        />
        Use as my default shipping address
      </label>
      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
        <Link href="/account/addresses" className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
