"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/forms/form-alert";
import { Button, Textarea } from "@/components/ui";
import { initialFormState, type FormState } from "@/lib/forms/form-state";
import { cn } from "@/lib/utils/cn";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function OptionsForm({ action, defaultText }: { action: Action; defaultText: string }) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  return (
    <form action={formAction} className="space-y-4">
      <FormAlert state={state} />
      <label className="block text-sm">
        <span className="font-medium">Options</span>
        <span className="mt-1 block text-ink-muted">
          One per line, up to 3. Add a colour code after a value for a swatch:{" "}
          <span className="font-mono text-ink">Color: Ivory #EEE8DD, Rust #B25A33</span> or{" "}
          <span className="font-mono text-ink">Size: Small, Large</span>. Leave empty for a single
          variant.
        </span>
        <Textarea
          name="options"
          rows={4}
          className="mt-2 font-mono text-xs"
          defaultValue={state.values?.options ?? defaultText}
        />
      </label>
      <Button type="submit" variant="secondary" loading={pending}>
        Save options and update variants
      </Button>
    </form>
  );
}

export type VariantRow = {
  id: string;
  title: string;
  sku: string;
  price: string;
  compare: string;
  stock: number;
  threshold: number;
  active: boolean;
  imageId: string;
};

export function VariantsForm({
  action,
  variants,
  images,
}: {
  action: Action;
  variants: VariantRow[];
  images: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const errors = state.fieldErrors ?? {};
  const input = (name: string, id: string) =>
    cn(
      "h-9 w-full rounded border bg-surface px-2 text-sm",
      errors[`${name}.${id}`] ? "border-danger" : "border-line-strong",
    );

  return (
    <form action={formAction} className="space-y-4">
      <FormAlert state={state} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="text-xs text-ink-muted uppercase">
              <th className="py-2 pr-3 font-medium">Variant</th>
              <th className="py-2 pr-3 font-medium">SKU</th>
              <th className="py-2 pr-3 font-medium">Price</th>
              <th className="py-2 pr-3 font-medium">Was (sale)</th>
              <th className="py-2 pr-3 font-medium">Stock</th>
              <th className="py-2 pr-3 font-medium">Low at</th>
              <th className="py-2 pr-3 font-medium">Photo</th>
              <th className="py-2 font-medium">For sale</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr key={v.id} className={cn("border-t border-line", !v.active && "opacity-60")}>
                <td className="py-2 pr-3 font-medium">{v.title}</td>
                <td className="py-2 pr-3">
                  <input
                    name={`sku.${v.id}`}
                    defaultValue={v.sku}
                    className={input("sku", v.id)}
                    aria-label={`SKU for ${v.title}`}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    name={`price.${v.id}`}
                    defaultValue={v.price}
                    inputMode="decimal"
                    className={input("price", v.id)}
                    aria-label={`Price for ${v.title}`}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    name={`compare.${v.id}`}
                    defaultValue={v.compare}
                    inputMode="decimal"
                    placeholder="—"
                    className={input("compare", v.id)}
                    aria-label={`Original price for ${v.title}`}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    name={`stock.${v.id}`}
                    defaultValue={v.stock}
                    inputMode="numeric"
                    className={input("stock", v.id)}
                    aria-label={`Stock for ${v.title}`}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    name={`threshold.${v.id}`}
                    defaultValue={v.threshold}
                    inputMode="numeric"
                    className={input("threshold", v.id)}
                    aria-label={`Low-stock level for ${v.title}`}
                  />
                </td>
                <td className="py-2 pr-3">
                  <select
                    name={`image.${v.id}`}
                    defaultValue={v.imageId}
                    className="h-9 w-full rounded border border-line-strong bg-surface px-2 text-sm"
                    aria-label={`Photo for ${v.title}`}
                  >
                    <option value="">Default</option>
                    {images.map((image) => (
                      <option key={image.id} value={image.id}>
                        {image.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <input
                    type="checkbox"
                    name={`active.${v.id}`}
                    defaultChecked={v.active}
                    className="size-4 accent-ink"
                    aria-label={`${v.title} is for sale`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-muted">
        Stock changes made here are recorded in the inventory log. &quot;Was&quot; shows a
        crossed-out original price.
      </p>
      <Button type="submit" loading={pending}>
        Save variants
      </Button>
    </form>
  );
}
