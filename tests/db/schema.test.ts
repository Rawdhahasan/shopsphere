// @vitest-environment node
/**
 * Database security tests.
 *
 * Loads every migration into an in-memory Postgres 17 (PGlite) and checks the
 * rules from the point of view of each kind of user. No Supabase project or
 * Docker needed.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

type Role = "anon" | "authenticated" | "service_role";

const root = join(import.meta.dirname, "../..");
let db: PGlite;

const ids = {
  alice: "00000000-0000-4000-8000-00000000000a",
  bob: "00000000-0000-4000-8000-00000000000b",
  admin: "00000000-0000-4000-8000-0000000000ad",
};

/** Runs `fn` as a given database role and signed-in user, like a real Supabase request. */
async function as<T>(role: Role, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

const anon = <T>(fn: () => Promise<T>) => as("anon", null, fn);
const user = <T>(id: string, fn: () => Promise<T>) => as("authenticated", id, fn);

async function rows<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return (await db.query<T>(sql, params)).rows;
}

async function expectError(promise: Promise<unknown>, pattern: RegExp) {
  await expect(promise).rejects.toThrow(pattern);
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(join(root, "tests/db/supabase-stub.sql"), "utf8"));
  const migrationsDir = join(root, "supabase/migrations");
  for (const file of readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync(join(migrationsDir, file), "utf8"));
  }

  // Fixtures, created as the superuser (like the SQL editor).
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'alice@example.com', '{"full_name":"Alice Customer"}'),
       ($2, 'bob@example.com', '{}'),
       ($3, 'admin@example.com', '{}')`,
    [ids.alice, ids.bob, ids.admin],
  );
  await db.query("update public.profiles set role = 'admin' where id = $1", [ids.admin]);

  await db.exec(`
    insert into public.categories (id, name, slug) values
      ('10000000-0000-4000-8000-000000000001', 'Living', 'living');

    insert into public.products (id, category_id, name, slug, status) values
      ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Oak Lounge Chair', 'oak-lounge-chair', 'active'),
      ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Secret Prototype', 'secret-prototype', 'draft');

    insert into public.product_options (id, product_id, name) values
      ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Wood');
    insert into public.product_option_values (id, option_id, value) values
      ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Oak'),
      ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'Walnut');

    insert into public.product_variants (id, product_id, sku, title, price_cents, stock_quantity, is_active) values
      ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'CHAIR-OAK', 'Oak', 49000, 4, true),
      ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'CHAIR-WAL', 'Walnut', 59000, 2, true),
      ('40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'CHAIR-ASH', 'Ash', 39000, 9, false),
      ('40000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'PROTO-1', 'Default', 1000, 1, true);

    insert into public.product_variant_options (variant_id, option_value_id) values
      ('40000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001'),
      ('40000000-0000-4000-8000-000000000002', '31000000-0000-4000-8000-000000000002');

    insert into public.discount_codes (code, type, value) values ('WELCOME10', 'percentage', 10);
  `);
}, 60_000);

async function createPaidOrder(userId: string, productId: string, variantId: string) {
  const [order] = await rows<{ id: string }>(
    `insert into public.orders (user_id, email, status, subtotal_cents, total_cents, shipping_address)
     values ($1, 'x@example.com', 'paid', 49000, 49000, '{"city":"Oslo"}') returning id`,
    [userId],
  );
  await db.query(
    `insert into public.order_items (order_id, product_id, variant_id, product_name, sku, unit_price_cents, quantity, line_total_cents)
     values ($1, $2, $3, 'Oak Lounge Chair', 'CHAIR-OAK', 49000, 1, 49000)`,
    [order.id, productId, variantId],
  );
  return order.id;
}

describe("migrations", () => {
  it("apply cleanly and enable RLS on every public table", async () => {
    const unprotected = await rows(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(unprotected).toEqual([]);
  });
});

describe("profiles", () => {
  it("are created automatically on sign-up as customers", async () => {
    const [alice] = await rows<{ role: string; full_name: string }>(
      "select role, full_name from public.profiles where id = $1",
      [ids.alice],
    );
    expect(alice).toEqual({ role: "customer", full_name: "Alice Customer" });
  });

  it("let users edit their name but never their role", async () => {
    await user(ids.alice, () =>
      db.query("update public.profiles set full_name = 'Alice C.' where id = $1", [ids.alice]),
    );
    await expectError(
      user(ids.alice, () =>
        db.query("update public.profiles set role = 'admin' where id = $1", [ids.alice]),
      ),
      /cannot change your role/,
    );
  });

  it("are private to their owner", async () => {
    const visible = await user(ids.alice, () => rows("select id from public.profiles"));
    expect(visible).toEqual([{ id: ids.alice }]);
    const all = await user(ids.admin, () => rows("select id from public.profiles"));
    expect(all).toHaveLength(3);
  });
});

describe("catalog", () => {
  it("shows visitors only active products and active variants", async () => {
    const products = await anon(() => rows<{ slug: string }>("select slug from public.products"));
    expect(products.map((p) => p.slug)).toEqual(["oak-lounge-chair"]);

    const variants = await anon(() =>
      rows<{ sku: string }>("select sku from public.product_variants order by sku"),
    );
    expect(variants.map((v) => v.sku)).toEqual(["CHAIR-OAK", "CHAIR-WAL"]);
  });

  it("shows admins drafts too", async () => {
    const products = await user(ids.admin, () => rows("select id from public.products"));
    expect(products).toHaveLength(2);
  });

  it("blocks visitors and customers from editing products", async () => {
    await expectError(
      anon(() => db.query("insert into public.products (name, slug) values ('Hack', 'hack')")),
      /permission denied/,
    );
    await expectError(
      user(ids.alice, () =>
        db.query("insert into public.products (name, slug) values ('Hack', 'hack')"),
      ),
      /row-level security/,
    );
    const updated = await user(ids.alice, () =>
      db.query("update public.product_variants set price_cents = 1 where sku = 'CHAIR-OAK'"),
    );
    expect(updated.affectedRows).toBe(0);
  });

  it("keeps the product price range and stock in sync with active variants", async () => {
    const [chair] = await rows<{
      min_price_cents: number;
      max_price_cents: number;
      total_stock: number;
    }>(
      "select min_price_cents, max_price_cents, total_stock from public.products where slug = 'oak-lounge-chair'",
    );
    expect(chair).toEqual({ min_price_cents: 49000, max_price_cents: 59000, total_stock: 6 });
  });

  it("supports full-text search", async () => {
    const results = await anon(() =>
      rows(
        "select slug from public.products where search_vector @@ websearch_to_tsquery('english', 'lounge chairs')",
      ),
    );
    expect(results).toEqual([{ slug: "oak-lounge-chair" }]);
  });
});

describe("inventory", () => {
  it("lets admins adjust stock and logs the movement", async () => {
    const [{ adjust_variant_stock }] = await user(ids.admin, () =>
      rows<{ adjust_variant_stock: number }>(
        "select public.adjust_variant_stock($1, 5, 'restock', 'New shipment')",
        ["40000000-0000-4000-8000-000000000002"],
      ),
    );
    expect(adjust_variant_stock).toBe(7);
    const log = await rows("select quantity_change, reason from public.inventory_movements");
    expect(log).toEqual([{ quantity_change: 5, reason: "restock" }]);
  });

  it("never lets stock go below zero", async () => {
    await expectError(
      user(ids.admin, () =>
        db.query("select public.adjust_variant_stock($1, -100, 'adjustment')", [
          "40000000-0000-4000-8000-000000000001",
        ]),
      ),
      /below zero/,
    );
  });

  it("refuses stock changes from customers", async () => {
    await expectError(
      user(ids.alice, () =>
        db.query("select public.adjust_variant_stock($1, 50, 'restock')", [
          "40000000-0000-4000-8000-000000000001",
        ]),
      ),
      /Only admins/,
    );
  });
});

describe("addresses, cart and wishlist", () => {
  it("are private to each customer", async () => {
    await user(ids.alice, () =>
      db.query(
        `insert into public.addresses (user_id, full_name, line1, city, postal_code, country_code)
         values ($1, 'Alice', '1 Main St', 'Oslo', '0150', 'NO')`,
        [ids.alice],
      ),
    );
    await user(ids.alice, () =>
      db.query("insert into public.cart_items (user_id, variant_id, quantity) values ($1, $2, 1)", [
        ids.alice,
        "40000000-0000-4000-8000-000000000001",
      ]),
    );

    expect(await user(ids.bob, () => rows("select * from public.addresses"))).toEqual([]);
    expect(await user(ids.bob, () => rows("select * from public.cart_items"))).toEqual([]);
    expect(await user(ids.alice, () => rows("select * from public.cart_items"))).toHaveLength(1);
  });

  it("make the first address the default and keep only one default", async () => {
    const insertAddress = (isDefault: boolean) =>
      user(ids.bob, () =>
        db.query(
          `insert into public.addresses (user_id, full_name, line1, city, postal_code, country_code, is_default)
           values ($1, 'Bob', 'Street', 'Paris', '75001', 'FR', $2)`,
          [ids.bob, isDefault],
        ),
      );
    await insertAddress(false);
    await insertAddress(true);
    const defaults = await user(ids.bob, () =>
      rows("select is_default from public.addresses order by created_at, is_default"),
    );
    expect(defaults.filter((a) => a.is_default)).toHaveLength(1);
  });

  it("refuse adding items to someone else's cart", async () => {
    await expectError(
      user(ids.bob, () =>
        db.query(
          "insert into public.cart_items (user_id, variant_id, quantity) values ($1, $2, 1)",
          [ids.alice, "40000000-0000-4000-8000-000000000001"],
        ),
      ),
      /row-level security/,
    );
  });

  it("refuse adding hidden (draft) products to the cart", async () => {
    await expectError(
      user(ids.bob, () =>
        db.query(
          "insert into public.cart_items (user_id, variant_id, quantity) values ($1, $2, 1)",
          [ids.bob, "40000000-0000-4000-8000-000000000004"],
        ),
      ),
      /row-level security/,
    );
  });
});

describe("orders", () => {
  let aliceOrderId: string;

  beforeAll(async () => {
    aliceOrderId = await createPaidOrder(
      ids.alice,
      "20000000-0000-4000-8000-000000000001",
      "40000000-0000-4000-8000-000000000001",
    );
  });

  it("can't be created from a browser session", async () => {
    await expectError(
      user(ids.alice, () =>
        db.query(
          `insert into public.orders (user_id, email, subtotal_cents, total_cents, shipping_address)
           values ($1, 'a@example.com', 1, 1, '{}')`,
          [ids.alice],
        ),
      ),
      /permission denied/,
    );
  });

  it("are visible only to their customer and admins", async () => {
    expect(await user(ids.alice, () => rows("select id from public.orders"))).toEqual([
      { id: aliceOrderId },
    ]);
    expect(await user(ids.bob, () => rows("select id from public.orders"))).toEqual([]);
    expect(await user(ids.bob, () => rows("select id from public.order_items"))).toEqual([]);
    expect(await user(ids.admin, () => rows("select id from public.orders"))).toHaveLength(1);
  });

  it("let admins advance fulfilment but not touch money or payment state", async () => {
    await user(ids.admin, () =>
      db.query(
        "update public.orders set status = 'shipped', tracking_number = 'TRACK123' where id = $1",
        [aliceOrderId],
      ),
    );
    await expectError(
      user(ids.admin, () =>
        db.query("update public.orders set total_cents = 0, subtotal_cents = 0 where id = $1", [
          aliceOrderId,
        ]),
      ),
      /payment details cannot be edited/,
    );
    await expectError(
      user(ids.admin, () =>
        db.query("update public.orders set status = 'refunded' where id = $1", [aliceOrderId]),
      ),
      /Invalid order status change/,
    );
  });

  it("record a tracking timeline with timestamps", async () => {
    const history = await user(ids.alice, () =>
      rows<{ status: string }>(
        "select status from public.order_status_history where order_id = $1 order by created_at",
        [aliceOrderId],
      ),
    );
    expect(history.map((h) => h.status)).toEqual(["paid", "shipped"]);
    const [order] = await rows<{ shipped_at: Date | null }>(
      "select shipped_at from public.orders where id = $1",
      [aliceOrderId],
    );
    expect(order.shipped_at).not.toBeNull();
  });

  it("reject inconsistent totals in the database itself", async () => {
    await expectError(
      db.query(
        `insert into public.orders (user_id, email, subtotal_cents, shipping_cents, total_cents, shipping_address)
         values ($1, 'x@example.com', 1000, 500, 1000, '{}')`,
        [ids.alice],
      ),
      /check constraint/,
    );
  });
});

describe("checkout", () => {
  const oak = "40000000-0000-4000-8000-000000000001";
  const walnut = "40000000-0000-4000-8000-000000000002";
  const service = <T>(fn: () => Promise<T>) => as("service_role", null, fn);

  const stockOf = async (variantId: string) =>
    (
      await rows<{ stock_quantity: number }>(
        "select stock_quantity from public.product_variants where id = $1",
        [variantId],
      )
    )[0].stock_quantity;

  const line = (variantId: string, price: number, quantity: number) => ({
    variant_id: variantId,
    quantity,
    unit_price_cents: price,
    image_path: null,
  });

  async function reserve(lines: ReturnType<typeof line>[], discount: string | null = null) {
    const subtotal = lines.reduce((sum, l) => sum + l.unit_price_cents * l.quantity, 0);
    const discountRow = discount
      ? (
          await rows<{ id: string }>("select id from public.discount_codes where code = $1", [
            discount,
          ])
        )[0]
      : null;
    const [result] = await service(() =>
      rows<{ order_id: string; order_number: string }>(
        `select * from public.reserve_order($1, 'alice@example.com', $2::jsonb, $3, 0, 0, 0, $3, $4, $5,
           '{"city":"Oslo"}'::jsonb, now() + interval '30 minutes')`,
        [ids.alice, JSON.stringify(lines), subtotal, discountRow?.id ?? null, discount],
      ),
    );
    return result;
  }

  it("reserves stock and creates a pending order with its items", async () => {
    const before = await stockOf(oak);
    const order = await reserve([line(oak, 49000, 1)]);
    expect(order.order_number).toMatch(/^SS-\d+$/);
    expect(await stockOf(oak)).toBe(before - 1);
    const [saved] = await rows<{ status: string; total_cents: number }>(
      "select status, total_cents from public.orders where id = $1",
      [order.order_id],
    );
    expect(saved).toEqual({ status: "pending_payment", total_cents: 49000 });
    const movements = await rows<{ quantity_change: number; reason: string }>(
      "select quantity_change, reason from public.inventory_movements where order_id = $1",
      [order.order_id],
    );
    expect(movements).toEqual([{ quantity_change: -1, reason: "reservation" }]);
  });

  it("is all or nothing when an item runs out", async () => {
    const [oakBefore, walnutBefore] = [await stockOf(oak), await stockOf(walnut)];
    const orderCount = (await rows("select id from public.orders")).length;
    await expectError(
      reserve([line(oak, 49000, 1), line(walnut, 59000, walnutBefore + 1)]),
      /OUT_OF_STOCK:CHAIR-WAL/,
    );
    expect(await stockOf(oak)).toBe(oakBefore);
    expect(await stockOf(walnut)).toBe(walnutBefore);
    expect(await rows("select id from public.orders")).toHaveLength(orderCount);
  });

  it("refuses a price that changed since the cart was totalled", async () => {
    await expectError(reserve([line(oak, 100, 1)]), /PRICE_CHANGED:CHAIR-OAK/);
  });

  it("refuses inactive variants and unpublished products", async () => {
    await expectError(
      reserve([line("40000000-0000-4000-8000-000000000003", 39000, 1)]),
      /UNAVAILABLE/,
    );
    await expectError(
      reserve([line("40000000-0000-4000-8000-000000000004", 1000, 1)]),
      /UNAVAILABLE/,
    );
  });

  it("marks an order paid once, counts the discount once and empties the cart", async () => {
    await db.query(
      "insert into public.cart_items (user_id, variant_id, quantity) values ($1, $2, 1) on conflict do nothing",
      [ids.alice, oak],
    );
    const [{ redemption_count: before }] = await rows<{ redemption_count: number }>(
      "select redemption_count from public.discount_codes where code = 'WELCOME10'",
    );
    const order = await reserve([line(oak, 49000, 1)], "WELCOME10");
    const pay = () =>
      service(() =>
        rows<{ paid: boolean }>(
          "select public.mark_order_paid($1, 'cs_test_1', 'pi_test_1') as paid",
          [order.order_id],
        ),
      );
    expect((await pay())[0].paid).toBe(true);
    expect((await pay())[0].paid).toBe(false);
    const [{ redemption_count: after }] = await rows<{ redemption_count: number }>(
      "select redemption_count from public.discount_codes where code = 'WELCOME10'",
    );
    expect(after).toBe(before + 1);
    expect(
      await rows("select 1 from public.cart_items where user_id = $1 and variant_id = $2", [
        ids.alice,
        oak,
      ]),
    ).toEqual([]);
    const [saved] = await rows<{ status: string; paid_at: Date | null }>(
      "select status, paid_at from public.orders where id = $1",
      [order.order_id],
    );
    expect(saved.status).toBe("paid");
    expect(saved.paid_at).not.toBeNull();
  });

  it("releases the stock of an unpaid order, but never of a paid one", async () => {
    const before = await stockOf(oak);
    const order = await reserve([line(oak, 49000, 1)]);
    const release = () =>
      service(() =>
        rows<{ released: boolean }>("select public.release_order($1) as released", [
          order.order_id,
        ]),
      );
    expect((await release())[0].released).toBe(true);
    expect(await stockOf(oak)).toBe(before);
    expect((await release())[0].released).toBe(false);
    const [saved] = await rows<{ status: string }>(
      "select status from public.orders where id = $1",
      [order.order_id],
    );
    expect(saved.status).toBe("cancelled");
  });

  it("refunds an unshipped order once, returning its stock", async () => {
    const before = await stockOf(oak);
    const order = await reserve([line(oak, 49000, 1)]);
    await service(() => db.query("select public.mark_order_paid($1)", [order.order_id]));
    const refund = () =>
      service(() =>
        rows<{ refunded: boolean }>("select public.refund_order($1, 'Changed mind') as refunded", [
          order.order_id,
        ]),
      );
    expect((await refund())[0].refunded).toBe(true);
    expect((await refund())[0].refunded).toBe(false);
    expect(await stockOf(oak)).toBe(before);
    const history = await rows<{ status: string }>(
      "select status from public.order_status_history where order_id = $1 order by created_at",
      [order.order_id],
    );
    expect(history.map((h) => h.status)).toEqual(["pending_payment", "paid", "refunded"]);
    await expectError(
      user(ids.admin, () => db.query("select public.refund_order($1)", [order.order_id])),
      /permission denied/,
    );
  });

  it("can't be called by visitors or customers", async () => {
    for (const run of [anon, <T>(fn: () => Promise<T>) => user(ids.alice, fn)]) {
      await expectError(
        run(() => db.query("select public.mark_order_paid(gen_random_uuid())")),
        /permission denied/,
      );
      await expectError(
        run(() => db.query("select public.release_order(gen_random_uuid())")),
        /permission denied/,
      );
    }
  });
});

describe("reviews", () => {
  const chair = "20000000-0000-4000-8000-000000000001";

  it("start as pending and get a verified badge only for real buyers", async () => {
    await user(ids.alice, () =>
      db.query(
        "insert into public.reviews (product_id, user_id, rating, status, is_verified_purchase) values ($1, $2, 5, 'approved', false)",
        [chair, ids.alice],
      ),
    );
    await user(ids.bob, () =>
      db.query(
        "insert into public.reviews (product_id, user_id, rating, status, is_verified_purchase) values ($1, $2, 1, 'approved', true)",
        [chair, ids.bob],
      ),
    );
    const reviews = await rows<{ user_id: string; status: string; is_verified_purchase: boolean }>(
      "select user_id, status, is_verified_purchase from public.reviews order by user_id",
    );
    expect(reviews).toEqual([
      { user_id: ids.alice, status: "pending", is_verified_purchase: true },
      { user_id: ids.bob, status: "pending", is_verified_purchase: false },
    ]);
  });

  it("hide pending reviews from the public", async () => {
    expect(await anon(() => rows("select id from public.reviews"))).toEqual([]);
  });

  it("can't be approved by their author", async () => {
    await expectError(
      user(ids.alice, () =>
        db.query("update public.reviews set status = 'approved' where user_id = $1", [ids.alice]),
      ),
      /Only admins can moderate/,
    );
  });

  it("count toward the rating only once an admin approves them", async () => {
    await user(ids.admin, () =>
      db.query("update public.reviews set status = 'approved' where user_id = $1", [ids.alice]),
    );
    const [product] = await rows<{ avg_rating: string; review_count: number }>(
      "select avg_rating, review_count from public.products where id = $1",
      [chair],
    );
    expect(product).toEqual({ avg_rating: "5.00", review_count: 1 });
    const [review] = await rows<{ moderated_by: string }>(
      "select moderated_by from public.reviews where user_id = $1",
      [ids.alice],
    );
    expect(review.moderated_by).toBe(ids.admin);
  });

  it("go back to moderation when the author edits them", async () => {
    await user(ids.alice, () =>
      db.query("update public.reviews set body = 'Edited' where user_id = $1", [ids.alice]),
    );
    const [review] = await rows<{ status: string }>(
      "select status from public.reviews where user_id = $1",
      [ids.alice],
    );
    expect(review.status).toBe("pending");
  });

  it("are listed publicly with a privacy-safe author name, approved only", async () => {
    await user(ids.admin, () =>
      db.query("update public.reviews set status = 'approved' where user_id = $1", [ids.alice]),
    );
    const listed = await anon(() => rows("select * from public.get_product_reviews($1)", [chair]));
    expect(listed).toHaveLength(1);
    expect(listed[0]).toMatchObject({ rating: 5, author_name: "Alice C." });
    expect(Object.keys(listed[0])).not.toContain("user_id");
    expect(JSON.stringify(listed)).not.toContain("alice@example.com");

    const draft = "20000000-0000-4000-8000-000000000002";
    expect(await anon(() => rows("select * from public.get_product_reviews($1)", [draft]))).toEqual(
      [],
    );
  });
});

describe("restricted data", () => {
  it("hides discount codes from customers", async () => {
    expect(await anon(() => rows("select * from public.discount_codes"))).toEqual([]);
    expect(await user(ids.alice, () => rows("select * from public.discount_codes"))).toEqual([]);
    expect(await user(ids.admin, () => rows("select code from public.discount_codes"))).toEqual([
      { code: "WELCOME10" },
    ]);
  });

  it("locks Stripe event records to the server", async () => {
    await expectError(
      user(ids.admin, () => db.query("select * from public.stripe_events")),
      /permission denied/,
    );
    await as("service_role", null, () =>
      db.query("insert into public.stripe_events (id, type) values ('evt_1', 'test')"),
    );
  });

  it("lets anyone read store settings but only admins change them", async () => {
    expect(await anon(() => rows("select store_name from public.store_settings"))).toEqual([
      { store_name: "ShopSphere" },
    ]);
    const result = await user(ids.alice, () =>
      db.query("update public.store_settings set tax_rate_bps = 0"),
    );
    expect(result.affectedRows).toBe(0);
  });
});

describe("storage", () => {
  const object = (bucket: string, name: string) =>
    db.query("insert into storage.objects (bucket_id, name) values ($1, $2)", [bucket, name]);
  const rename = (from: string, to: string) =>
    db.query("update storage.objects set name = $2 where name = $1", [from, to]);
  const remove = (name: string) => db.query("delete from storage.objects where name = $1", [name]);
  const exists = async (name: string) =>
    (await rows("select 1 from storage.objects where name = $1", [name])).length === 1;

  const aliceAvatar = `${ids.alice}/me.webp`;
  const bobAvatar = `${ids.bob}/me.webp`;

  describe("catalog images", () => {
    it("can be uploaded, replaced and deleted by admins", async () => {
      await user(ids.admin, () => object("product-images", "chair.jpg"));
      await user(ids.admin, () => object("category-images", "living.jpg"));

      const updated = await user(ids.admin, () => rename("chair.jpg", "chair-v2.jpg"));
      expect(updated.affectedRows).toBe(1);

      const deleted = await user(ids.admin, () => remove("living.jpg"));
      expect(deleted.affectedRows).toBe(1);
      expect(await exists("living.jpg")).toBe(false);
    });

    it("can't be uploaded by customers or visitors", async () => {
      await expectError(
        user(ids.alice, () => object("product-images", "x.jpg")),
        /row-level security/,
      );
      await expectError(
        anon(() => object("product-images", "x.jpg")),
        /row-level security/,
      );
    });

    it("can't be replaced or deleted by customers or visitors", async () => {
      expect((await user(ids.alice, () => rename("chair-v2.jpg", "hacked.jpg"))).affectedRows).toBe(
        0,
      );
      expect((await user(ids.alice, () => remove("chair-v2.jpg"))).affectedRows).toBe(0);
      expect((await anon(() => rename("chair-v2.jpg", "hacked.jpg"))).affectedRows).toBe(0);
      expect((await anon(() => remove("chair-v2.jpg"))).affectedRows).toBe(0);
      expect(await exists("chair-v2.jpg")).toBe(true);
    });

    it("can't be moved into the avatars bucket", async () => {
      await expectError(
        user(ids.admin, () =>
          db.query("update storage.objects set bucket_id = 'avatars' where name = 'chair-v2.jpg'"),
        ),
        /row-level security/,
      );
    });
  });

  describe("avatars", () => {
    it("can be uploaded, replaced and deleted by their owner", async () => {
      await user(ids.alice, () => object("avatars", aliceAvatar));

      const updated = await user(ids.alice, () => rename(aliceAvatar, `${ids.alice}/me-v2.webp`));
      expect(updated.affectedRows).toBe(1);

      const deleted = await user(ids.alice, () => remove(`${ids.alice}/me-v2.webp`));
      expect(deleted.affectedRows).toBe(1);
      expect(await exists(`${ids.alice}/me-v2.webp`)).toBe(false);
    });

    it("can only be uploaded into the user's own folder", async () => {
      await expectError(
        user(ids.alice, () => object("avatars", bobAvatar)),
        /row-level security/,
      );
      await expectError(
        user(ids.alice, () => object("avatars", "me.webp")),
        /row-level security/,
      );
      await expectError(
        anon(() => object("avatars", bobAvatar)),
        /row-level security/,
      );
    });

    it("can't be listed, replaced or deleted by other users", async () => {
      await user(ids.bob, () => object("avatars", bobAvatar));

      expect(await user(ids.alice, () => rows("select name from storage.objects"))).toEqual([]);
      expect(
        (await user(ids.alice, () => rename(bobAvatar, `${ids.alice}/stolen.webp`))).affectedRows,
      ).toBe(0);
      expect((await user(ids.alice, () => remove(bobAvatar))).affectedRows).toBe(0);
      expect((await anon(() => remove(bobAvatar))).affectedRows).toBe(0);
      expect(await exists(bobAvatar)).toBe(true);
    });

    it("can't be moved into another user's folder", async () => {
      await expectError(
        user(ids.bob, () => rename(bobAvatar, `${ids.alice}/planted.webp`)),
        /row-level security/,
      );
    });

    it("aren't writable by admins (least privilege)", async () => {
      expect((await user(ids.admin, () => remove(bobAvatar))).affectedRows).toBe(0);
      await expectError(
        user(ids.admin, () => object("avatars", bobAvatar)),
        /row-level security/,
      );
    });
  });
});
