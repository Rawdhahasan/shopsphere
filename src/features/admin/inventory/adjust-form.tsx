"use client";

import { useActionState } from "react";
import { initialFormState, type FormState } from "@/lib/forms/form-state";
import { cn } from "@/lib/utils/cn";

export function AdjustStockForm({
  action,
  label,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const error =
    state.status === "error" ? (Object.values(state.fieldErrors ?? {})[0] ?? state.message) : null;
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <label>
        <span className="sr-only">Change for {label}</span>
        <input
          name="change"
          inputMode="numeric"
          placeholder="+10"
          defaultValue={state.status === "error" ? state.values?.change : ""}
          className={cn(
            "h-8 w-20 rounded border bg-surface px-2 text-sm",
            error ? "border-danger" : "border-line-strong",
          )}
        />
      </label>
      <label>
        <span className="sr-only">Reason</span>
        <select
          name="reason"
          className="h-8 rounded border border-line-strong bg-surface px-2 text-sm"
        >
          <option value="restock">Restock</option>
          <option value="adjustment">Correction</option>
          <option value="return">Return</option>
        </select>
      </label>
      <label>
        <span className="sr-only">Note</span>
        <input
          name="note"
          placeholder="Note (optional)"
          maxLength={200}
          className="h-8 w-36 rounded border border-line-strong bg-surface px-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-8 rounded bg-ink px-3 text-xs font-medium text-canvas disabled:opacity-50"
      >
        {pending ? "Saving…" : "Apply"}
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
      {state.status === "success" && <span className="text-xs text-success">{state.message}</span>}
    </form>
  );
}
