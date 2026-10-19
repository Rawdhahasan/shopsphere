"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { Button, FormField, Input, Select } from "@/components/ui";
import { initialFormState, type FormState } from "@/lib/forms/form-state";

export type DiscountDefaults = {
  code: string;
  description: string;
  type: "percentage" | "fixed_amount";
  value: string;
  minSubtotal: string;
  maxRedemptions: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

export function DiscountForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: DiscountDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  const v = (key: keyof DiscountDefaults) => state.values?.[key] ?? String(defaults[key] ?? "");
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormAlert state={state} />
      <div className="grid gap-5 md:grid-cols-3">
        <FormField label="Code" error={errors.code}>
          <Input
            name="code"
            defaultValue={v("code")}
            className="uppercase"
            placeholder="WELCOME10"
          />
        </FormField>
        <FormField label="Type" error={errors.type}>
          <Select name="type" defaultValue={v("type")}>
            <option value="percentage">Percent off</option>
            <option value="fixed_amount">Amount off (USD)</option>
          </Select>
        </FormField>
        <FormField label="Value" hint="10 = 10% or $10" error={errors.value}>
          <Input name="value" inputMode="decimal" defaultValue={v("value")} />
        </FormField>
        <FormField label="Description" error={errors.description}>
          <Input
            name="description"
            defaultValue={v("description")}
            placeholder="10% off your first order"
          />
        </FormField>
        <FormField
          label="Minimum order (USD)"
          hint="Leave empty for none"
          error={errors.minSubtotal}
        >
          <Input name="minSubtotal" inputMode="decimal" defaultValue={v("minSubtotal")} />
        </FormField>
        <FormField
          label="Usage limit"
          hint="Leave empty for unlimited"
          error={errors.maxRedemptions}
        >
          <Input name="maxRedemptions" inputMode="numeric" defaultValue={v("maxRedemptions")} />
        </FormField>
        <FormField label="Starts" hint="Optional" error={errors.startsAt}>
          <Input name="startsAt" type="datetime-local" defaultValue={v("startsAt")} />
        </FormField>
        <FormField label="Ends" hint="Optional" error={errors.endsAt}>
          <Input name="endsAt" type="datetime-local" defaultValue={v("endsAt")} />
        </FormField>
        <label className="flex items-center gap-3 self-end pb-3 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={state.values ? state.values.active === "on" : defaults.active}
            className="size-4 accent-ink"
          />
          Active
        </label>
      </div>
      <Button type="submit" loading={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
