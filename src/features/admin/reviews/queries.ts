import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ReviewStatus = Database["public"]["Enums"]["review_status"];

export async function listReviewsForModeration(status: string) {
  if (!(await requireAdmin())) return null;
  const supabase = await createClient();
  const wanted: ReviewStatus = status === "approved" || status === "rejected" ? status : "pending";
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, title, body, status, is_verified_purchase, created_at, moderated_at, product:products(name, slug), author:profiles!reviews_user_id_fkey(full_name, email)",
    )
    .eq("status", wanted)
    .order("created_at", { ascending: wanted === "pending" })
    .limit(100);
  if (error) throw new Error(`Couldn't load reviews: ${error.message}`);
  const { count: pending } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return { status: wanted, reviews: data, pendingCount: pending ?? 0 };
}
