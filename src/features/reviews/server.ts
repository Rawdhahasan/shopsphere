import "server-only";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";

/** The signed-in shopper's own review of a product (any status), or null. */
export async function getMyReview(productId: string) {
  if (!isSupabaseConfigured()) return null;
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, title, body, status, is_verified_purchase")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .maybeSingle();
  return data;
}
