import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { siteConfig } from "@/config/site";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { isSupabaseConfigured } from "@/lib/env/public";
import { formatMoney } from "@/lib/money";
import { createPublicClient } from "@/lib/supabase/public";

export type StoreSettings = {
  storeName: string;
  supportEmail: string | null;
  announcement: string;
  flatShippingCents: number;
  freeShippingThresholdCents: number | null;
  taxRateBps: number;
};

const FALLBACK: StoreSettings = {
  storeName: siteConfig.name,
  supportEmail: null,
  announcement: siteConfig.announcement,
  flatShippingCents: 1200,
  freeShippingThresholdCents: 15000,
  taxRateBps: 0,
};

/** Store-wide settings edited in Admin → Settings. Cached; saving settings refreshes them. */
export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  if (!isSupabaseConfigured()) return FALLBACK;
  const { data } = await createPublicClient()
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return FALLBACK;
  return {
    storeName: data.store_name,
    supportEmail: data.support_email,
    announcement: data.announcement_text || FALLBACK.announcement,
    flatShippingCents: data.flat_shipping_cents,
    freeShippingThresholdCents: data.free_shipping_threshold_cents,
    taxRateBps: data.tax_rate_bps,
  };
}

export function shippingPromise(settings: StoreSettings): string {
  return settings.freeShippingThresholdCents === null
    ? `Flat ${formatMoney(settings.flatShippingCents)} shipping`
    : `Free shipping over ${formatMoney(settings.freeShippingThresholdCents)}`;
}
