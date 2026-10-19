"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { Button, FormField, Input, Textarea } from "@/components/ui";
import { FormAlert } from "@/components/forms/form-alert";
import { initialFormState, type FormState } from "@/lib/forms/form-state";
import { cn } from "@/lib/utils/cn";

export function ReviewForm({
  action,
  defaults,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: { rating: number; title: string | null; body: string | null };
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [rating, setRating] = useState(defaults?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const errors = state.fieldErrors ?? {};
  const shown = hover || rating;

  return (
    <form action={formAction} className="max-w-xl space-y-5" noValidate>
      <FormAlert state={state} />
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="peer sr-only"
              />
              <Star
                aria-hidden="true"
                className={cn(
                  "size-7 rounded transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30",
                  n <= shown ? "fill-accent text-accent" : "text-line-strong",
                )}
                strokeWidth={1.5}
              />
              <span className="sr-only">
                {n} star{n === 1 ? "" : "s"}
              </span>
            </label>
          ))}
        </div>
        {errors.rating && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {errors.rating}
          </p>
        )}
      </fieldset>
      <FormField label="Title (optional)" error={errors.title}>
        <Input
          name="title"
          maxLength={120}
          defaultValue={state.values?.title ?? defaults?.title ?? ""}
        />
      </FormField>
      <FormField label="Your review" error={errors.body}>
        <Textarea
          name="body"
          rows={5}
          maxLength={5000}
          required
          defaultValue={state.values?.body ?? defaults?.body ?? ""}
        />
      </FormField>
      <Button type="submit" loading={pending}>
        {defaults ? "Update review" : "Submit review"}
      </Button>
    </form>
  );
}
