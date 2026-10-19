import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const SOLD = ["paid", "processing", "shipped", "delivered"] as const;

export async function listCustomers(q: string) {
  if (!(await requireAdmin())) return null;
  const supabase = await createClient();
  const search = q
    .replace(/[^\p{L}\p{N}@._+ -]/gu, "")
    .trim()
    .slice(0, 80);
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .limit(200);
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  const [{ data: profiles, error }, { data: orders }] = await Promise.all([
    query,
    supabase.from("orders").select("user_id, total_cents, created_at").in("status", SOLD),
  ]);
  if (error) throw new Error(`Couldn't load customers: ${error.message}`);

  const stats = new Map<string, { orders: number; spent: number; last: string | null }>();
  for (const o of orders ?? []) {
    if (!o.user_id) continue;
    const s = stats.get(o.user_id) ?? { orders: 0, spent: 0, last: null };
    s.orders += 1;
    s.spent += o.total_cents;
    if (!s.last || o.created_at > s.last) s.last = o.created_at;
    stats.set(o.user_id, s);
  }
  return profiles.map((p) => ({
    ...p,
    ...(stats.get(p.id) ?? { orders: 0, spent: 0, last: null }),
  }));
}

export async function getCustomer(id: string) {
  if (!(await requireAdmin())) return null;
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = await createClient();
  const [{ data: profile }, { data: addresses }, { data: orders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("addresses")
      .select(
        "id, label, full_name, line1, line2, city, region, postal_code, country_code, is_default",
      )
      .eq("user_id", id)
      .order("is_default", { ascending: false }),
    supabase
      .from("orders")
      .select("id, order_number, status, total_cents, currency, created_at")
      .eq("user_id", id)
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false }),
  ]);
  if (!profile) return null;
  return { profile, addresses: addresses ?? [], orders: orders ?? [] };
}
