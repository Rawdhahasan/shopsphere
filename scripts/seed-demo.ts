/**
 * Creates demo accounts and realistic activity on top of the catalog seed:
 * an admin, demo customers, addresses, past orders with tracking timelines,
 * reviews, a wishlist and a cart.
 *
 *   npm run db:seed:demo
 *
 * Requires in .env.local: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_DEMO_PASSWORD.
 * Safe to re-run: every row has a fixed id and existing accounts are reused.
 *
 * Demo orders are historical, so they don't reduce current stock.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateOrderTotals } from "@/lib/pricing/calculate-totals";
import { products } from "../supabase/seed/catalog";
import { createSeedAdminClient, requireEnv } from "./lib/admin-env";
import { seedId, variantSku, variantTitle, productImagePath } from "./lib/seed-ids";

type Customer = {
  key: string;
  email: string;
  fullName: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  line1: string;
};

const customers: Customer[] = [
  {
    key: "ava",
    email: "ava.thompson@shopsphere.example",
    fullName: "Ava Thompson",
    line1: "214 Larch Street",
    city: "Portland",
    region: "OR",
    postal: "97209",
    country: "US",
  },
  {
    key: "noah",
    email: "noah.bennett@shopsphere.example",
    fullName: "Noah Bennett",
    line1: "48 Grove Lane",
    city: "Brooklyn",
    region: "NY",
    postal: "11215",
    country: "US",
  },
  {
    key: "mia",
    email: "mia.laurent@shopsphere.example",
    fullName: "Mia Laurent",
    line1: "9 Rue des Lilas",
    city: "Lyon",
    region: "",
    postal: "69003",
    country: "FR",
  },
  {
    key: "liam",
    email: "liam.okafor@shopsphere.example",
    fullName: "Liam Okafor",
    line1: "77 Harbour Road",
    city: "Vancouver",
    region: "BC",
    postal: "V6B 1A1",
    country: "CA",
  },
];

// Small seeded random generator so every run produces the same orders.
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function ensureUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  fullName: string,
) {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  return data.user.id;
}

function check<T>(result: { error: unknown; data?: T }, what: string) {
  if (result.error)
    throw new Error(`${what}: ${(result.error as { message?: string }).message ?? result.error}`);
  return result.data;
}

async function main() {
  const supabase = createSeedAdminClient();
  const adminEmail = requireEnv("SEED_ADMIN_EMAIL");
  const adminPassword = requireEnv("SEED_ADMIN_PASSWORD");
  const demoPassword = requireEnv("SEED_DEMO_PASSWORD");
  for (const [name, value] of [
    ["SEED_ADMIN_PASSWORD", adminPassword],
    ["SEED_DEMO_PASSWORD", demoPassword],
  ]) {
    if (value.length < 12) throw new Error(`${name} must be at least 12 characters.`);
  }

  // --- Accounts ---------------------------------------------------------------
  // Only the role changes, so using your own existing account as the admin keeps its name.
  const adminId = await ensureUser(supabase, adminEmail, adminPassword, "Store Admin");
  check(
    await supabase.from("profiles").update({ role: "admin" }).eq("id", adminId),
    "promote admin",
  );
  console.log(`✓ admin ${adminEmail}`);

  const userIds = new Map<string, string>();
  for (const c of customers) {
    const id = await ensureUser(supabase, c.email, demoPassword, c.fullName);
    userIds.set(c.key, id);
    check(
      await supabase.from("addresses").upsert({
        id: seedId("address", c.key),
        user_id: id,
        label: "Home",
        full_name: c.fullName,
        line1: c.line1,
        city: c.city,
        region: c.region || null,
        postal_code: c.postal,
        country_code: c.country,
        is_default: true,
      }),
      `address for ${c.key}`,
    );
  }
  console.log(`✓ ${customers.length} demo customers with addresses`);

  // --- Orders -----------------------------------------------------------------
  const { data: settings } = await supabase.from("store_settings").select("*").eq("id", 1).single();
  const shipping = {
    flatCents: settings?.flat_shipping_cents ?? 1200,
    freeThresholdCents: settings?.free_shipping_threshold_cents ?? 15000,
  };
  const taxRateBps = settings?.tax_rate_bps ?? 0;

  const buyable = products.filter((p) => (p.status ?? "active") === "active");
  const rand = random(20261018);
  const statuses = [
    "delivered",
    "delivered",
    "delivered",
    "shipped",
    "processing",
    "paid",
  ] as const;
  const day = 86_400_000;
  const purchases = new Map<string, Set<string>>(); // customer key → product slugs bought
  let orderCount = 0;

  for (let i = 0; i < 18; i++) {
    const customer = customers[i % customers.length];
    const userId = userIds.get(customer.key)!;
    const placedAt = new Date(Date.now() - Math.floor(4 + rand() * 116) * day);
    const status = i < 3 ? statuses[3 + (i % 3)] : statuses[Math.floor(rand() * 3)];

    const lineCount = 1 + Math.floor(rand() * 3);
    const lines = new Map<
      string,
      { product: (typeof buyable)[number]; variantIndex: number; quantity: number }
    >();
    while (lines.size < lineCount) {
      const product = buyable[Math.floor(rand() * buyable.length)];
      const variantIndex = Math.floor(rand() * product.variants.length);
      const sku = variantSku(product.skuPrefix, product.variants[variantIndex].options);
      lines.set(sku, { product, variantIndex, quantity: 1 + Math.floor(rand() * 2) });
    }

    const items = [...lines.entries()].map(([sku, { product, variantIndex, quantity }]) => {
      const variant = product.variants[variantIndex];
      return {
        sku,
        product,
        variantTitle: variantTitle(variant.options),
        unitPriceCents: variant.priceCents,
        quantity,
        imagePath: product.images.length
          ? productImagePath(product.slug, variant.image ?? 0)
          : null,
      };
    });

    const discount =
      i % 5 === 0 ? { type: "percentage" as const, value: 10, minSubtotalCents: 0 } : null;
    const totals = calculateOrderTotals({
      lines: items.map((item) => ({
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
      })),
      discount,
      shipping,
      taxRateBps,
    });

    const orderId = seedId("order", String(i));
    const hours = (h: number) => new Date(placedAt.getTime() + h * 3_600_000).toISOString();
    const timeline: { status: string; at: string; note?: string }[] = [
      { status: "paid", at: hours(0.05) },
    ];
    if (status !== "paid") timeline.push({ status: "processing", at: hours(20) });
    if (status === "shipped" || status === "delivered")
      timeline.push({ status: "shipped", at: hours(44), note: "Handed to carrier" });
    if (status === "delivered") timeline.push({ status: "delivered", at: hours(120) });

    check(
      await supabase.from("orders").upsert({
        id: orderId,
        user_id: userId,
        email: customer.email,
        status,
        subtotal_cents: totals.subtotalCents,
        discount_cents: totals.discountCents,
        shipping_cents: totals.shippingCents,
        tax_cents: totals.taxCents,
        total_cents: totals.totalCents,
        discount_code_id: discount ? seedId("discount", "WELCOME10") : null,
        discount_code: discount ? "WELCOME10" : null,
        shipping_address: {
          full_name: customer.fullName,
          line1: customer.line1,
          city: customer.city,
          region: customer.region || null,
          postal_code: customer.postal,
          country_code: customer.country,
        },
        stripe_checkout_session_id: `cs_test_seed_${i}`,
        stripe_payment_intent_id: `pi_test_seed_${i}`,
        tracking_carrier: status === "shipped" || status === "delivered" ? "DHL Express" : null,
        tracking_number:
          status === "shipped" || status === "delivered"
            ? `JD0146${String(100000 + i * 7919).slice(0, 6)}`
            : null,
        created_at: placedAt.toISOString(),
        paid_at: hours(0.05),
        shipped_at: timeline.find((t) => t.status === "shipped")?.at ?? null,
        delivered_at: timeline.find((t) => t.status === "delivered")?.at ?? null,
      }),
      `order ${i}`,
    );

    check(
      await supabase.from("order_items").upsert(
        items.map((item, index) => ({
          id: seedId("order-item", `${i}:${index}`),
          order_id: orderId,
          product_id: seedId("product", item.product.slug),
          variant_id: seedId("variant", item.sku),
          product_name: item.product.name,
          variant_title: item.variantTitle === "Default" ? null : item.variantTitle,
          sku: item.sku,
          image_path: item.imagePath,
          unit_price_cents: item.unitPriceCents,
          quantity: item.quantity,
          line_total_cents: item.unitPriceCents * item.quantity,
          created_at: placedAt.toISOString(),
        })),
      ),
      `order ${i} items`,
    );

    // Replace the trigger-written history with a realistic, back-dated timeline.
    check(
      await supabase.from("order_status_history").delete().eq("order_id", orderId),
      `order ${i} history reset`,
    );
    check(
      await supabase.from("order_status_history").insert(
        timeline.map((t) => ({
          order_id: orderId,
          status: t.status,
          note: t.note ?? null,
          created_at: t.at,
        })),
      ),
      `order ${i} history`,
    );

    const bought = purchases.get(customer.key) ?? new Set<string>();
    items.forEach((item) => bought.add(item.product.slug));
    purchases.set(customer.key, bought);
    orderCount += 1;
  }
  console.log(`✓ ${orderCount} orders with items and tracking timelines`);

  // --- Reviews ----------------------------------------------------------------
  const reviewTexts = [
    {
      rating: 5,
      title: "Even better in person",
      body: "The texture and colour are exactly as pictured, and the quality is obvious the moment you unpack it.",
    },
    {
      rating: 5,
      title: "Worth every penny",
      body: "Beautifully made and carefully packaged. It has become the piece everyone asks about.",
    },
    {
      rating: 4,
      title: "Lovely, slightly smaller than expected",
      body: "Gorgeous finish. Check the dimensions, as it's a touch more compact than I imagined, but I'd still buy it again.",
    },
    {
      rating: 4,
      title: "Great everyday quality",
      body: "Holds up well to daily use and still looks new. Delivery was quick, too.",
    },
    {
      rating: 3,
      title: "Nice, but colour differs a little",
      body: "Well made, but the shade is a little warmer than on my screen.",
    },
  ];
  let reviewCount = 0;
  for (const [key, slugs] of purchases) {
    const userId = userIds.get(key)!;
    for (const [index, slug] of [...slugs].slice(0, 3).entries()) {
      const text = reviewTexts[(reviewCount + index) % reviewTexts.length];
      const status =
        reviewCount % 7 === 3 ? "pending" : reviewCount % 11 === 5 ? "rejected" : "approved";
      check(
        await supabase.from("reviews").upsert(
          {
            id: seedId("review", `${key}:${slug}`),
            product_id: seedId("product", slug),
            user_id: userId,
            rating: text.rating,
            title: text.title,
            body: text.body,
            status,
            is_verified_purchase: true,
            moderated_by: status === "pending" ? null : adminId,
            moderated_at: status === "pending" ? null : new Date().toISOString(),
          },
          { onConflict: "product_id,user_id" },
        ),
        `review ${key}/${slug}`,
      );
      reviewCount += 1;
    }
  }
  console.log(`✓ ${reviewCount} reviews (approved, pending and rejected)`);

  // --- Wishlist and cart for the first demo customer --------------------------
  const ava = userIds.get("ava")!;
  const wishlist = ["arden-lounge-chair", "linden-round-mirror", "halo-table-lamp"];
  check(
    await supabase.from("wishlist_items").upsert(
      wishlist.map((slug) => ({ user_id: ava, product_id: seedId("product", slug) })),
      { onConflict: "user_id,product_id" },
    ),
    "wishlist",
  );
  const cart: { slug: string; options: Record<string, string>; quantity: number }[] = [
    { slug: "kiln-stoneware-tumbler", options: { Glaze: "Moss" }, quantity: 2 },
    { slug: "washed-linen-napkins", options: { Color: "Natural" }, quantity: 1 },
  ];
  check(
    await supabase.from("cart_items").upsert(
      cart.map((item) => {
        const product = products.find((p) => p.slug === item.slug)!;
        return {
          user_id: ava,
          variant_id: seedId("variant", variantSku(product.skuPrefix, item.options)),
          quantity: item.quantity,
        };
      }),
      { onConflict: "user_id,variant_id" },
    ),
    "cart",
  );
  console.log("✓ wishlist and cart for Ava");

  console.log(
    `\nDone. Sign in as ${adminEmail} (admin) or any demo customer, e.g. ${customers[0].email}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
