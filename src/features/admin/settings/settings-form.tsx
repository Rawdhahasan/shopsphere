"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { Button, FormField, Input } from "@/components/ui";
import { initialFormState, type FormState } from "@/lib/forms/form-state";

export type SettingsDefaults = {
  storeName: string;
  supportEmail: string;
  announcement: string;
  flatShipping: string;
  freeThreshold: string;
  taxRate: string;
};

export function SettingsForm({
  action,
  defaults,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: SettingsDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  const v = (key: keyof SettingsDefaults) => state.values?.[key] ?? defaults[key];
  return (
    <form action={formAction} className="max-w-3xl space-y-6" noValidate>
      <FormAlert state={state} />
      <fieldset className="grid gap-5 md:grid-cols-2">
        <legend className="mb-3 text-sm font-medium">Store</legend>
        <FormField label="Store name" error={errors.storeName}>
          <Input name="storeName" defaultValue={v("storeName")} />
        </FormField>
        <FormField label="Support email" error={errors.supportEmail}>
          <Input name="supportEmail" type="email" defaultValue={v("supportEmail")} />
        </FormField>
        <div className="md:col-span-2">
          <FormField
            label="Announcement bar"
            hint="Shown at the top of every store page."
            error={errors.announcement}
          >
            <Input name="announcement" maxLength={140} defaultValue={v("announcement")} />
          </FormField>
        </div>
      </fieldset>
      <fieldset className="grid gap-5 md:grid-cols-3">
        <legend className="mb-3 text-sm font-medium">Shipping and tax</legend>
        <FormField label="Flat shipping (USD)" error={errors.flatShipping}>
          <Input name="flatShipping" inputMode="decimal" defaultValue={v("flatShipping")} />
        </FormField>
        <FormField
          label="Free shipping over (USD)"
          hint="Leave empty for never"
          error={errors.freeThreshold}
        >
          <Input name="freeThreshold" inputMode="decimal" defaultValue={v("freeThreshold")} />
        </FormField>
        <FormField
          label="Sales tax (%)"
          hint="Applied to goods after discounts"
          error={errors.taxRate}
        >
          <Input name="taxRate" inputMode="decimal" defaultValue={v("taxRate")} />
        </FormField>
      </fieldset>
      <Button type="submit" loading={pending}>
        Save settings
      </Button>
    </form>
  );
}
