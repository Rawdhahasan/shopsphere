"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { Button, FormField, Input } from "@/components/ui";
import { initialFormState, type FormState } from "@/lib/forms/form-state";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** One fulfilment step as a single-button form (Processing, Delivered). */
export function StepButton({ action, label }: { action: Action; label: string }) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  return (
    <form action={formAction} className="space-y-3">
      <FormAlert state={state} />
      {state.status !== "success" && (
        <Button type="submit" loading={pending}>
          {label}
        </Button>
      )}
    </form>
  );
}

/** "Mark as shipped" needs a carrier and a tracking number. */
export function ShipForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert state={state} />
      {state.status !== "success" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Carrier" error={errors.carrier}>
              <Input name="carrier" defaultValue={state.values?.carrier ?? "DHL Express"} />
            </FormField>
            <FormField label="Tracking number" error={errors.trackingNumber}>
              <Input name="trackingNumber" defaultValue={state.values?.trackingNumber ?? ""} />
            </FormField>
          </div>
          <Button type="submit" loading={pending}>
            Mark as shipped
          </Button>
        </>
      )}
    </form>
  );
}

/** Refund with a typed confirmation, because it can't be undone. */
export function RefundForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  return (
    <form action={formAction} className="space-y-3">
      <FormAlert state={state} />
      {state.status !== "success" && (
        <>
          <p className="text-sm text-ink-muted">
            Refunds the full payment and puts the items back in stock. Type{" "}
            <span className="font-mono text-ink">REFUND</span> to confirm.
          </p>
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="sr-only">Confirmation</span>
              <Input name="confirm" autoComplete="off" placeholder="REFUND" />
            </label>
            <Button type="submit" variant="danger" loading={pending}>
              Refund order
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
