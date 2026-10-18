# Database

Migrations live in [`supabase/migrations`](../supabase/migrations) and run in filename order:

| File                              | Contents                            |
| --------------------------------- | ----------------------------------- |
| `…001_initial_schema.sql`         | Enums, tables, constraints, indexes |
| `…002_functions_and_triggers.sql` | Business rules enforced by triggers |
| `…003_row_level_security.sql`     | Who can read and write each table   |
| `…004_storage.sql`                | Image buckets and upload rules      |

## Entity overview

```
auth.users ─1:1─ profiles ─┬─< addresses
                           ├─< cart_items >── product_variants
                           ├─< wishlist_items >── products
                           ├─< reviews >── products
                           └─< orders ─┬─< order_items
                                       └─< order_status_history

categories ─< products ─┬─< product_images
                        ├─< product_options ─< product_option_values
                        └─< product_variants ─< product_variant_options >── product_option_values
                                     └─< inventory_movements

discount_codes ─< orders     store_settings (single row)     stripe_events
```

## Product variants

Every product has **at least one variant**. Price, SKU and stock always live on the variant, so the cart, checkout and inventory code never needs a special case.

| Product      | Options                                   | Variants                            |
| ------------ | ----------------------------------------- | ----------------------------------- |
| Ceramic vase | none                                      | one "Default" variant               |
| Linen throw  | Color: Sand, Sage, Charcoal               | 3 variants                          |
| Lounge chair | Wood: Oak, Walnut × Fabric: Bouclé, Linen | 4 variants, each with its own stock |

`products.min_price_cents`, `max_price_cents` and `total_stock` are kept up to date by a trigger, so listings can sort by price and show "From $X" without extra queries.

## Rules enforced in the database

| Rule                                                         | How                                                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Stock can never be negative                                  | `check (stock_quantity >= 0)`; `adjust_variant_stock()` refuses changes that would go below zero |
| Order totals always add up                                   | `check (total = subtotal − discount + shipping + tax)`                                           |
| Customers can't become admins                                | `guard_profile_update` trigger                                                                   |
| Reviews start as pending; "verified purchase" can't be faked | `guard_review` trigger computes it from paid orders                                              |
| Ratings count approved reviews only                          | `on_review_change` trigger                                                                       |
| Admins can't edit an order's money or payment state          | `guard_order_update` trigger; only trusted server code can                                       |
| Valid status flow: paid → processing → shipped → delivered   | `guard_order_update` trigger                                                                     |
| One default address per customer                             | partial unique index + `manage_default_address` trigger                                          |
| Each order has a tracking timeline                           | `log_order_status` trigger writes `order_status_history`                                         |
| Every manual stock change is audited                         | `adjust_variant_stock()` writes `inventory_movements`                                            |

## Access summary (RLS)

| Table                                           | Visitor       | Customer               | Admin                       |
| ----------------------------------------------- | ------------- | ---------------------- | --------------------------- |
| categories, products, images, options, variants | read active   | read active            | full                        |
| profiles                                        | —             | own                    | read/update all             |
| addresses, cart_items, wishlist_items           | —             | own                    | read addresses              |
| orders, order_items, order_status_history       | —             | read own               | read all; update fulfilment |
| reviews                                         | read approved | create/edit/delete own | moderate                    |
| discount_codes                                  | —             | —                      | full                        |
| inventory_movements                             | —             | —                      | read (writes via function)  |
| store_settings                                  | read          | read                   | update                      |
| stripe_events                                   | —             | —                      | — (server only)             |

### Storage buckets

All three buckets are public, so images are viewable by URL. The policies below control who may list, upload, replace or delete files.

| Bucket                          | Visitor   | Customer                                        | Admin     |
| ------------------------------- | --------- | ----------------------------------------------- | --------- |
| product-images, category-images | view only | view only                                       | full      |
| avatars                         | view only | full, only inside their own `<user id>/` folder | view only |

Every bucket has a SELECT policy alongside its write policies, because Postgres only lets a user update or delete rows they can select. UPDATE policies also have `WITH CHECK`, so files can't be moved into another bucket or user's folder.

## Testing

`tests/db/schema.test.ts` loads every migration into PGlite (an in-memory Postgres 17) together with a small stub of Supabase's `auth` and `storage` schemas, then checks the rules above as a visitor, two different customers, and an admin. Run it with `npm test`.

## Seed data

| Source                     | Produces                        | Contents                                                                                                                                              |
| -------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/seed/catalog.ts` | `supabase/seed.sql` (generated) | 5 categories, 44 products (1 draft), 78 variants, opening stock log, 4 discount codes                                                                 |
| `scripts/seed-images.ts`   | Storage files                   | 48 product photos and 5 category photos, 4:5 WebP                                                                                                     |
| `scripts/seed-demo.ts`     | Accounts and activity           | 1 admin, 4 customers with addresses, 18 orders over 4 months with tracking timelines, 12 reviews (approved, pending, rejected), a wishlist and a cart |

Rows use fixed ids derived from stable keys (`scripts/lib/seed-ids.ts`), so every script can be re-run safely:

- `seed.sql` only inserts missing rows (`on conflict do nothing`) and only fills in store settings on a fresh store.
- The image script skips files that already exist unless run with `--force`.
- The demo script reuses existing accounts (never changes their passwords) and only resets its own demo orders and reviews.
- Demo orders are historical and don't reduce current stock.

## Workflow

```bash
npm run db:new -- add_something   # create a new migration file
npm run db:push                    # apply pending migrations to the linked project
npm run db:types                   # regenerate src/types/database.ts
```

Never edit a migration that has already been applied to a shared database. Add a new one instead.
