import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function listInventory({ q, filter }: { q: string; filter: string }) {
  if (!(await requireAdmin())) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      "id, sku, title, stock_quantity, low_stock_threshold, is_active, product:products(id, name, status)",
    )
    .eq("is_active", true)
    .order("stock_quantity");
  if (error) throw new Error(`Couldn't load inventory: ${error.message}`);
  const search = q.trim().toLowerCase();
  return data
    .map((v) => ({
      ...v,
      product: v.product as { id: string; name: string; status: string } | null,
    }))
    .filter((v) => v.product && v.product.status !== "archived")
    .filter((v) =>
      filter === "out"
        ? v.stock_quantity === 0
        : filter === "low"
          ? v.stock_quantity > 0 && v.stock_quantity <= v.low_stock_threshold
          : true,
    )
    .filter(
      (v) =>
        !search ||
        v.sku.toLowerCase().includes(search) ||
        v.product!.name.toLowerCase().includes(search),
    );
}

export async function listRecentMovements(limit = 25) {
  if (!(await requireAdmin())) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_movements")
    .select(
      "id, quantity_change, reason, note, created_at, variant:product_variants(sku, title, product:products(name)), order:orders(order_number)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
