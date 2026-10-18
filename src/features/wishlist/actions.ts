"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeRedirectPath } from "@/lib/auth/routes";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** Adds or removes a product from the signed-in shopper's wishlist. Guests are sent to sign in. */
export async function toggleWishlist(productId: string, returnTo: string) {
  const id = z.uuid().safeParse(productId);
  if (!id.success) return { ok: false as const, saved: false };
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(safeRedirectPath(returnTo, "/wishlist"))}`);
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", id.data)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", id.data)
    : await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: id.data });
  if (error) return { ok: false as const, saved: Boolean(existing) };
  refresh();
  return { ok: true as const, saved: !existing };
}
