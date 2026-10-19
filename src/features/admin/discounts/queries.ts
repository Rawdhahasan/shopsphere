import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type DiscountState = "active" | "scheduled" | "expired" | "used-up" | "paused";

export function discountState(
  d: {
    is_active: boolean;
    starts_at: string | null;
    ends_at: string | null;
    max_redemptions: number | null;
    redemption_count: number;
  },
  now = Date.now(),
): DiscountState {
  if (!d.is_active) return "paused";
  if (d.ends_at && new Date(d.ends_at).getTime() <= now) return "expired";
  if (d.max_redemptions !== null && d.redemption_count >= d.max_redemptions) return "used-up";
  if (d.starts_at && new Date(d.starts_at).getTime() > now) return "scheduled";
  return "active";
}

export async function listDiscounts() {
  if (!(await requireAdmin())) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Couldn't load discount codes: ${error.message}`);
  return data;
}
