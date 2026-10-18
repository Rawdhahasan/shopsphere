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

## Testing

`tests/db/schema.test.ts` loads every migration into PGlite (an in-memory Postgres 17) together with a small stub of Supabase's `auth` and `storage` schemas, then checks the rules above as a visitor, two different customers, and an admin. Run it with `npm test`.

## Workflow

```bash
npm run db:new -- add_something   # create a new migration file
npm run db:push                    # apply pending migrations to the linked project
npm run db:types                   # regenerate src/types/database.ts
```

Never edit a migration that has already been applied to a shared database. Add a new one instead.
