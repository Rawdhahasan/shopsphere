"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { errorState, parseForm, type FormState } from "@/lib/forms/form-state";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validation/review";

/**
 * Creates or updates the shopper's review. The database sets it to pending
 * (moderation) and computes "verified purchase" itself, so neither can be
 * faked from the browser.
 */
export async function submitReview(
  productId: string,
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(`/products/${slug}`);
  if (!z.uuid().safeParse(productId).success) return errorState("This product can't be reviewed.");
  const parsed = parseForm(reviewSchema, formData);
  if (!parsed.success) return parsed.state;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .maybeSingle();

  const values = { rating: parsed.data.rating, title: parsed.data.title, body: parsed.data.body };
  const { error } = existing
    ? await supabase.from("reviews").update(values).eq("id", existing.id)
    : await supabase.from("reviews").insert({ ...values, product_id: productId, user_id: user.id });
  if (error) return errorState("We couldn't save your review. Please try again.", formData);

  refresh();
  return {
    status: "success",
    message: "Thank you! Your review will appear once our team has approved it.",
  };
}
