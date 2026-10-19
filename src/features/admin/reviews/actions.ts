"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Approves or rejects a review. guard_review() records who moderated it, and
 * on_review_change() recalculates the product's rating from approved reviews.
 */
export async function moderateReview(reviewId: string, status: "approved" | "rejected") {
  if (!(await requireAdmin())) return;
  if (!z.uuid().safeParse(reviewId).success) return;
  const supabase = await createClient();
  await supabase.from("reviews").update({ status }).eq("id", reviewId);
  updateTag(CATALOG_TAG);
  refresh();
}
