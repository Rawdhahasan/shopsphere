"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { requireAdmin } from "@/lib/auth/session";
import { errorState, parseForm, type FormState } from "@/lib/forms/form-state";
import { parseMoneyToCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z
  .object({
    storeName: z.string().trim().min(1, "Enter the store name.").max(80),
    supportEmail: z.union([z.email("Enter a valid email."), z.literal("")]),
    announcement: z.string().trim().max(140, "Keep it under 140 characters."),
    flatShipping: z.string().trim(),
    freeThreshold: z.string().trim(),
    taxRate: z.string().trim(),
  })
  .transform((d, ctx) => {
    const flat = parseMoneyToCents(d.flatShipping);
    if (flat === null) {
      ctx.addIssue({ code: "custom", path: ["flatShipping"], message: "Enter an amount like 12." });
      return z.NEVER;
    }
    const free = d.freeThreshold ? parseMoneyToCents(d.freeThreshold) : null;
    if (d.freeThreshold && free === null) {
      ctx.addIssue({
        code: "custom",
        path: ["freeThreshold"],
        message: "Enter an amount, or leave empty.",
      });
      return z.NEVER;
    }
    const tax = Number(d.taxRate || "0");
    if (!Number.isFinite(tax) || tax < 0 || tax > 100 || Math.round(tax * 100) !== tax * 100) {
      ctx.addIssue({ code: "custom", path: ["taxRate"], message: "Enter a percent like 8.25." });
      return z.NEVER;
    }
    return {
      store_name: d.storeName,
      support_email: d.supportEmail || null,
      announcement_text: d.announcement || null,
      flat_shipping_cents: flat,
      free_shipping_threshold_cents: free,
      tax_rate_bps: Math.round(tax * 100),
    };
  });

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await requireAdmin())) return errorState("Only admins can change settings.");
  const parsed = parseForm(settingsSchema, formData);
  if (!parsed.success) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase.from("store_settings").update(parsed.data).eq("id", 1);
  if (error) return errorState("Settings couldn't be saved.", formData);
  updateTag(CATALOG_TAG);
  refresh();
  return { status: "success", message: "Settings saved. The store shows them straight away." };
}
