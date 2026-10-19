"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { errorState, parseForm, type FormState } from "@/lib/forms/form-state";
import { parseMoneyToCents } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

const optionalDate = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return null;
    const date = new Date(v);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date." });
      return z.NEVER;
    }
    return date.toISOString();
  });

const discountSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,32}$/, "3–32 letters, numbers, dashes or underscores."),
    description: z
      .string()
      .trim()
      .max(200)
      .transform((v) => v || null),
    type: z.enum(["percentage", "fixed_amount"]),
    value: z.string().trim(),
    minSubtotal: z.string().trim(),
    maxRedemptions: z.string().trim(),
    startsAt: optionalDate,
    endsAt: optionalDate,
    active: z.literal("on").optional().transform(Boolean),
  })
  .transform((d, ctx) => {
    const value = d.type === "percentage" ? Number(d.value) : parseMoneyToCents(d.value);
    if (
      value === null ||
      !Number.isInteger(value) ||
      value <= 0 ||
      (d.type === "percentage" && value > 100)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message:
          d.type === "percentage"
            ? "Enter a whole percent from 1 to 100."
            : "Enter an amount like 25.",
      });
      return z.NEVER;
    }
    const minSubtotal = d.minSubtotal ? parseMoneyToCents(d.minSubtotal) : 0;
    if (minSubtotal === null) {
      ctx.addIssue({ code: "custom", path: ["minSubtotal"], message: "Enter an amount like 150." });
      return z.NEVER;
    }
    const maxRedemptions = d.maxRedemptions ? Number(d.maxRedemptions) : null;
    if (maxRedemptions !== null && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)) {
      ctx.addIssue({
        code: "custom",
        path: ["maxRedemptions"],
        message: "Leave empty or enter 1 or more.",
      });
      return z.NEVER;
    }
    if (d.startsAt && d.endsAt && d.endsAt <= d.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "The end must be after the start.",
      });
      return z.NEVER;
    }
    return {
      code: d.code,
      description: d.description,
      type: d.type,
      value,
      min_subtotal_cents: minSubtotal,
      max_redemptions: maxRedemptions,
      starts_at: d.startsAt,
      ends_at: d.endsAt,
      is_active: d.active,
    };
  });

export async function saveDiscount(
  discountId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireAdmin())) return errorState("Only admins can manage discount codes.");
  const parsed = parseForm(discountSchema, formData);
  if (!parsed.success) return parsed.state;
  const supabase = await createClient();
  const { error } = discountId
    ? z.uuid().safeParse(discountId).success
      ? await supabase.from("discount_codes").update(parsed.data).eq("id", discountId)
      : { error: { code: "bad-id", message: "" } }
    : await supabase.from("discount_codes").insert(parsed.data);
  if (error) {
    return errorState(
      error.code === "23505"
        ? "That code already exists."
        : error.message.includes("check")
          ? "The usage limit can't be lower than the times the code was already used."
          : "The discount code couldn't be saved.",
      formData,
    );
  }
  refresh();
  redirect("/admin/discounts?saved=1");
}

export async function setDiscountActive(discountId: string, active: boolean) {
  if (!(await requireAdmin())) return;
  if (!z.uuid().safeParse(discountId).success) return;
  const supabase = await createClient();
  await supabase.from("discount_codes").update({ is_active: active }).eq("id", discountId);
  refresh();
}
