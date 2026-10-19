"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { requireAdmin } from "@/lib/auth/session";
import { errorState, parseForm, type FormState } from "@/lib/forms/form-state";
import { createClient } from "@/lib/supabase/server";

const adjustSchema = z.object({
  change: z.coerce
    .number({ error: "Enter a number." })
    .int("Use a whole number.")
    .refine((n) => n !== 0, "Enter a change other than 0.")
    .refine((n) => Math.abs(n) <= 100000, "That change is too large."),
  reason: z.enum(["restock", "adjustment", "return"]),
  note: z
    .string()
    .trim()
    .max(200)
    .transform((v) => v || null),
});

/** Adds or removes stock. adjust_variant_stock() refuses to go below zero and logs the change. */
export async function adjustStock(
  variantId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireAdmin())) return errorState("Only admins can change stock.");
  if (!z.uuid().safeParse(variantId).success) return errorState("Unknown variant.");
  const parsed = parseForm(adjustSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("adjust_variant_stock", {
    p_variant_id: variantId,
    p_change: parsed.data.change,
    p_reason: parsed.data.reason,
    p_note: parsed.data.note ?? undefined,
  });
  if (error) {
    return errorState(
      error.message.includes("below zero")
        ? "Stock can't go below zero."
        : "Stock couldn't be changed.",
      formData,
    );
  }
  updateTag(CATALOG_TAG);
  refresh();
  return { status: "success", message: `Stock is now ${data}.` };
}
