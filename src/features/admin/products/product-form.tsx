"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { Button, FormField, Input, Select, Textarea } from "@/components/ui";
import { initialFormState, type FormState } from "@/lib/forms/form-state";

export type ProductFormDefaults = {
  name: string;
  slug: string;
  categoryId: string;
  status: "draft" | "active" | "archived";
  featured: boolean;
  brand: string;
  shortDescription: string;
  description: string;
  specifications: string;
  seoTitle: string;
  seoDescription: string;
};

export function ProductForm({
  action,
  defaults,
  categories,
  isNew,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults: ProductFormDefaults;
  categories: { id: string; name: string }[];
  isNew: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  const v = (key: keyof ProductFormDefaults) => state.values?.[key] ?? String(defaults[key] ?? "");

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormAlert state={state} />
      <div className="grid gap-5 md:grid-cols-2">
        <FormField label="Name" error={errors.name}>
          <Input name="name" required defaultValue={v("name")} />
        </FormField>
        <FormField
          label="URL slug"
          hint="Leave empty to create it from the name."
          error={errors.slug}
        >
          <Input name="slug" defaultValue={v("slug")} placeholder="e.g. linen-throw" />
        </FormField>
        <FormField label="Category" error={errors.categoryId}>
          <Select name="categoryId" defaultValue={v("categoryId")}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status" error={errors.status}>
          <Select name="status" defaultValue={v("status")}>
            <option value="draft">Draft (hidden)</option>
            <option value="active">Active (for sale)</option>
            <option value="archived">Archived (hidden)</option>
          </Select>
        </FormField>
        <FormField label="Brand" error={errors.brand}>
          <Input name="brand" defaultValue={v("brand")} />
        </FormField>
        <label className="flex items-center gap-3 self-end pb-3 text-sm">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={state.values ? state.values.featured === "on" : defaults.featured}
            className="size-4 accent-ink"
          />
          Feature on the home page
        </label>
      </div>

      {isNew && (
        <div className="grid gap-5 rounded-md bg-subtle p-4 md:grid-cols-2">
          <FormField
            label="Price (USD)"
            error={errors.price}
            hint="You can add sizes or colours later."
          >
            <Input
              name="price"
              inputMode="decimal"
              placeholder="49.00"
              defaultValue={state.values?.price ?? ""}
            />
          </FormField>
          <FormField label="Opening stock" error={errors.stock}>
            <Input name="stock" inputMode="numeric" defaultValue={state.values?.stock ?? "0"} />
          </FormField>
        </div>
      )}

      <FormField
        label="Summary"
        hint="One sentence shown under the product name."
        error={errors.shortDescription}
      >
        <Textarea
          name="shortDescription"
          rows={2}
          maxLength={300}
          defaultValue={v("shortDescription")}
        />
      </FormField>
      <FormField
        label="Description"
        hint="Separate paragraphs with a blank line."
        error={errors.description}
      >
        <Textarea name="description" rows={6} defaultValue={v("description")} />
      </FormField>
      <FormField
        label="Specifications"
        hint='One per line, e.g. "Dimensions: W 80 × D 40 cm".'
        error={errors.specifications}
      >
        <Textarea name="specifications" rows={4} defaultValue={v("specifications")} />
      </FormField>
      <details className="rounded-md border border-line p-4">
        <summary className="cursor-pointer text-sm font-medium">Search engine listing</summary>
        <div className="mt-4 grid gap-5">
          <FormField label="SEO title" hint="70 characters or fewer." error={errors.seoTitle}>
            <Input name="seoTitle" maxLength={70} defaultValue={v("seoTitle")} />
          </FormField>
          <FormField
            label="SEO description"
            hint="160 characters or fewer."
            error={errors.seoDescription}
          >
            <Textarea
              name="seoDescription"
              rows={2}
              maxLength={160}
              defaultValue={v("seoDescription")}
            />
          </FormField>
        </div>
      </details>
      <Button type="submit" loading={pending}>
        {isNew ? "Create product" : "Save details"}
      </Button>
    </form>
  );
}
