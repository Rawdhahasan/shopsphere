import "server-only";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env/public";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { publicStorageUrl } from "@/lib/supabase/storage";
import {
  GUEST_CART_COOKIE,
  mergeCartLines,
  parseGuestCart,
  serializeGuestCart,
  type CartLine,
} from "./guest-cookie";

export type CartItem = {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantTitle: string | null;
  sku: string;
  unitPriceCents: number;
  compareAtCents: number | null;
  quantity: number;
  stock: number;
  imageUrl: string | null;
  imageAlt: string;
  /** Asked for more than is in stock right now. */
  overStock: boolean;
};

export type StoreShipping = {
  flatCents: number;
  freeThresholdCents: number | null;
  taxRateBps: number;
};

export type Cart = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  shipping: StoreShipping;
  /** Lines that were removed because the product is no longer for sale. */
  removedCount: number;
};

const GUEST_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function readGuestCart(): Promise<CartLine[]> {
  return parseGuestCart((await cookies()).get(GUEST_CART_COOKIE)?.value);
}

/** Only callable from Server Actions and Route Handlers, where cookies can be written. */
export async function writeGuestCart(lines: CartLine[]) {
  const store = await cookies();
  if (lines.length === 0) store.delete(GUEST_CART_COOKIE);
  else store.set(GUEST_CART_COOKIE, serializeGuestCart(lines), GUEST_COOKIE_OPTIONS);
}

/** The raw lines of the current shopper's cart: the account cart when signed in, else the cookie. */
export async function getCartLines(): Promise<{ userId: string | null; lines: CartLine[] }> {
  const user = await getSessionUser();
  if (!user) return { userId: null, lines: await readGuestCart() };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("variant_id, quantity")
    .eq("user_id", user.id)
    .order("created_at");
  if (error) throw new Error(`Couldn't load your cart: ${error.message}`);
  return {
    userId: user.id,
    lines: data.map((r) => ({ variantId: r.variant_id, quantity: r.quantity })),
  };
}

export async function getCartCount(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const { lines } = await getCartLines();
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export async function getStoreShipping(): Promise<StoreShipping> {
  const { data } = await createPublicClient()
    .from("store_settings")
    .select("flat_shipping_cents, free_shipping_threshold_cents, tax_rate_bps")
    .eq("id", 1)
    .maybeSingle();
  return {
    flatCents: data?.flat_shipping_cents ?? 1200,
    freeThresholdCents: data ? data.free_shipping_threshold_cents : 15000,
    taxRateBps: data?.tax_rate_bps ?? 0,
  };
}

type VariantRow = {
  id: string;
  sku: string;
  title: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  stock_quantity: number;
  image_id: string | null;
  product: {
    id: string;
    slug: string;
    name: string;
    images: { id: string; storage_path: string; alt_text: string; position: number }[];
  } | null;
};

/**
 * Current prices and stock for a set of variants, read as a visitor: inactive
 * variants and unpublished products are simply missing from the result.
 */
export async function loadVariants(variantIds: string[]): Promise<Map<string, VariantRow>> {
  if (variantIds.length === 0) return new Map();
  const { data, error } = await createPublicClient()
    .from("product_variants")
    .select(
      `id, sku, title, price_cents, compare_at_price_cents, stock_quantity, image_id,
       product:products(id, slug, name, images:product_images(id, storage_path, alt_text, position))`,
    )
    .in("id", variantIds);
  if (error) throw new Error(`Couldn't load cart products: ${error.message}`);
  return new Map((data as unknown as VariantRow[]).filter((v) => v.product).map((v) => [v.id, v]));
}

export async function getCart(): Promise<Cart> {
  const [{ lines }, shipping] = await Promise.all([getCartLines(), getStoreShipping()]);
  const variants = await loadVariants(lines.map((l) => l.variantId));

  const items: CartItem[] = [];
  for (const line of lines) {
    const v = variants.get(line.variantId);
    if (!v?.product) continue;
    const images = [...v.product.images].sort((a, b) => a.position - b.position);
    const image = images.find((i) => i.id === v.image_id) ?? images[0];
    items.push({
      variantId: v.id,
      productId: v.product.id,
      productSlug: v.product.slug,
      productName: v.product.name,
      variantTitle: v.title === "Default" ? null : v.title,
      sku: v.sku,
      unitPriceCents: v.price_cents,
      compareAtCents: v.compare_at_price_cents,
      quantity: line.quantity,
      stock: v.stock_quantity,
      imageUrl: image ? publicStorageUrl("product-images", image.storage_path) : null,
      imageAlt: image?.alt_text || v.product.name,
      overStock: line.quantity > v.stock_quantity,
    });
  }

  return {
    items,
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotalCents: items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    shipping,
    removedCount: lines.length - items.length,
  };
}

/**
 * Moves a guest cart into the signed-in account (quantities add up), then
 * clears the cookie. Called right after sign-in, sign-up and email links.
 * Never throws: a failed merge must not block signing in.
 */
export async function mergeGuestCartIntoAccount(
  userId: string,
  /** The client that just signed in, so its fresh session is used. */
  client?: Awaited<ReturnType<typeof createClient>>,
) {
  try {
    const guest = await readGuestCart();
    if (guest.length === 0) return;
    const supabase = client ?? (await createClient());
    const { data: existing } = await supabase
      .from("cart_items")
      .select("variant_id, quantity")
      .eq("user_id", userId);
    const account = (existing ?? []).map((r) => ({
      variantId: r.variant_id,
      quantity: r.quantity,
    }));
    // Drop products that stopped being sold, or the whole upsert is refused by RLS.
    const forSale = await loadVariants(guest.map((l) => l.variantId));
    const merged = mergeCartLines(
      account,
      guest.filter((l) => forSale.has(l.variantId)),
    );
    if (merged.length === 0) return writeGuestCart([]);
    const { error } = await supabase.from("cart_items").upsert(
      merged.map((l) => ({ user_id: userId, variant_id: l.variantId, quantity: l.quantity })),
      { onConflict: "user_id,variant_id" },
    );
    if (!error) await writeGuestCart([]);
  } catch {
    // Keep the guest cookie so nothing is lost; the next sign-in retries.
  }
}
