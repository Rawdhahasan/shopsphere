"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { Button, FormField, Input } from "@/components/ui";
import type { FormAction } from "@/features/auth/components/auth-forms";
import type { FormState } from "@/lib/forms/form-state";

export function ProfileForm({
  action,
  email,
  defaults,
}: {
  action: FormAction;
  email: string;
  defaults: { fullName: string; phone: string };
}) {
  const initial: FormState = { status: "idle", values: defaults };
  const [state, formAction, pending] = useActionState(action, initial);
  const values = state.values ?? defaults;

  return (
    <form action={formAction} className="max-w-md space-y-5" noValidate>
      <FormAlert state={state} />
      <FormField label="Email" hint="Contact us to change the email on your account.">
        <Input value={email} readOnly disabled />
      </FormField>
      <FormField label="Full name" error={state.fieldErrors?.fullName}>
        <Input name="fullName" autoComplete="name" required defaultValue={values.fullName} />
      </FormField>
      <FormField
        label="Phone (optional)"
        hint="Used only for delivery updates."
        error={state.fieldErrors?.phone}
      >
        <Input name="phone" type="tel" autoComplete="tel" defaultValue={values.phone} />
      </FormField>
      <Button type="submit" loading={pending}>
        Save changes
      </Button>
    </form>
  );
}
