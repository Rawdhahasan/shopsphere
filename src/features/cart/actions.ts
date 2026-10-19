"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "./guest-cookie";
import { getCartLines, loadVariants, writeGuestCart } from "./server";

export type CartActionResult = { ok: true; count: number } | { ok: false; message: string };

const lineSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(0).max(MAX_LINE_QUANTITY),
});

/**
 * Sets a line's quantity (0 removes it). Prices are never sent from the
 * browser; the server only accepts a variant id and a quantity, and checks
 * the variant is for sale and in stock.
 */
async function setLine(
  variantId: string,
  quantity: number,
  mode: "add" | "set",
): Promise<CartActionResult> {
  const parsed = lineSchema.safeParse({ variantId, quantity });
  if (!parsed.success) return { ok: false, message: "That item couldn't be updated." };

  const { userId, lines } = await getCartLines();
  const existing = lines.find((l) => l.variantId === parsed.data.variantId)?.quantity ?? 0;
  const wanted = mode === "add" ? existing + parsed.data.quantity : parsed.data.quantity;

  if (wanted > 0) {
    const variant = (await loadVariants([parsed.data.variantId])).get(parsed.data.variantId);
    if (!variant) return { ok: false, message: "This item is no longer available." };
    if (variant.stock_quantity <= 0)
      return { ok: false, message: "Sorry, this item just sold out." };
    if (wanted > variant.stock_quantity) {
      return {
        ok: false,
        message:
          existing > 0
            ? `Only ${variant.stock_quantity} available, and you already have ${existing} in your cart.`
            : `Only ${variant.stock_quantity} available.`,
      };
    }
    if (wanted > MAX_LINE_QUANTITY) {
      return { ok: false, message: `You can buy up to ${MAX_LINE_QUANTITY} of one item.` };
    }
    if (existing === 0 && lines.length >= MAX_CART_LINES) {
      return { ok: false, message: "Your cart is full. Remove something to add this." };
    }
  }

  if (userId) {
    const supabase = await createClient();
    const { error } =
      wanted > 0
        ? await supabase
            .from("cart_items")
            .upsert(
              { user_id: userId, variant_id: parsed.data.variantId, quantity: wanted },
              { onConflict: "user_id,variant_id" },
            )
        : await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", userId)
            .eq("variant_id", parsed.data.variantId);
    if (error) return { ok: false, message: "Your cart couldn't be updated. Please try again." };
  } else {
    const next = lines.filter((l) => l.variantId !== parsed.data.variantId);
    if (wanted > 0) {
      const index = lines.findIndex((l) => l.variantId === parsed.data.variantId);
      const line = { variantId: parsed.data.variantId, quantity: wanted };
      if (index >= 0) next.splice(index, 0, line);
      else next.push(line);
    }
    await writeGuestCart(next);
  }

  refresh();
  const others = lines.filter((l) => l.variantId !== parsed.data.variantId);
  return { ok: true, count: others.reduce((sum, l) => sum + l.quantity, 0) + wanted };
}

export async function addToCart(variantId: string, quantity: number) {
  if (quantity < 1) return { ok: false, message: "Choose a quantity." } as CartActionResult;
  return setLine(variantId, quantity, "add");
}

export async function updateCartQuantity(variantId: string, quantity: number) {
  return setLine(variantId, quantity, "set");
}

export async function removeFromCart(variantId: string) {
  return setLine(variantId, 0, "set");
}
