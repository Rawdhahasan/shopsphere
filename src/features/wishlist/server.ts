import "server-only";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";

/** Whether the signed-in shopper saved this product. False for guests. */
export async function isInWishlist(productId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const user = await getSessionUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();
  return Boolean(data);
}

/** Saved product ids, newest first. */
export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load your wishlist: ${error.message}`);
  return data.map((r) => r.product_id);
}
