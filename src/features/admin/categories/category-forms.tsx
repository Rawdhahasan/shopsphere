"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { Button, FormField, Input, Textarea } from "@/components/ui";
import { initialFormState, type FormState } from "@/lib/forms/form-state";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function CategoryForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action;
  defaults: { name: string; slug: string; description: string; sortOrder: number; active: boolean };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  const v = (key: "name" | "slug" | "description" | "sortOrder") =>
    state.values?.[key] ?? String(defaults[key] ?? "");
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormAlert state={state} />
      <div className="grid gap-5 md:grid-cols-3">
        <FormField label="Name" error={errors.name}>
          <Input name="name" defaultValue={v("name")} />
        </FormField>
        <FormField
          label="URL slug"
          hint="Leave empty to create it from the name."
          error={errors.slug}
        >
          <Input name="slug" defaultValue={v("slug")} />
        </FormField>
        <FormField label="Order in menus" hint="Lower comes first" error={errors.sortOrder}>
          <Input name="sortOrder" inputMode="numeric" defaultValue={v("sortOrder")} />
        </FormField>
      </div>
      <FormField label="Description" error={errors.description}>
        <Textarea name="description" rows={2} defaultValue={v("description")} />
      </FormField>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={state.values ? state.values.active === "on" : defaults.active}
          className="size-4 accent-ink"
        />
        Visible in the store
      </label>
      <Button type="submit" loading={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}

export function CategoryImageForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        name="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="New header photo"
        className="text-xs file:mr-2 file:rounded file:border file:border-line-strong file:bg-surface file:px-2 file:py-1"
      />
      <Button type="submit" size="sm" variant="secondary" loading={pending}>
        Upload
      </Button>
      {state.message && (
        <span className={state.status === "error" ? "text-xs text-danger" : "text-xs text-success"}>
          {state.message}
        </span>
      )}
    </form>
  );
}
