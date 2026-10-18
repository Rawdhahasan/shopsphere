import { z } from "zod";

/**
 * The value every form Server Action returns. The form shows `message`
 * as a banner, `fieldErrors` under each input, and re-fills inputs from
 * `values` so the user doesn't have to retype them after an error.
 * Passwords are never echoed back.
 */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

const SENSITIVE_FIELDS = /password/i;

/** Plain string values from a form submission, without passwords or Next.js internals. */
export function safeValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string" || key.startsWith("$ACTION") || SENSITIVE_FIELDS.test(key))
      continue;
    values[key] = value;
  }
  return values;
}

/** Parses form data with a Zod schema; on failure returns a ready-to-use error state. */
export function parseForm<Schema extends z.ZodType>(
  schema: Schema,
  formData: FormData,
): { success: true; data: z.infer<Schema> } | { success: false; state: FormState } {
  const result = schema.safeParse(Object.fromEntries(formData));
  if (result.success) return { success: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= issue.message;
  }
  return {
    success: false,
    state: {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
      values: safeValues(formData),
    },
  };
}

export function errorState(message: string, formData?: FormData): FormState {
  return { status: "error", message, values: formData ? safeValues(formData) : undefined };
}
