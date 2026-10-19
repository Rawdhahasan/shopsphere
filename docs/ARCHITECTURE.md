# Architecture

## Overview

```
Browser ──► Next.js on Vercel
              ├─ Server Components     read data (catalog, orders)
              ├─ Server Actions        change data (cart, profile, admin edits), validated with Zod
              ├─ /api/webhooks/stripe  payment events from Stripe (signature-verified)
              └─ proxy.ts              refreshes the session cookie, redirects signed-out users
                     │                                   │
              Supabase (Postgres + RLS, Auth, Storage)   Stripe Checkout (test mode)
```

ShopSphere is a single Next.js application. The storefront lives in the `(store)` route group and the dashboard under `/admin`. There is no separate API server: reads happen in Server Components and writes in Server Actions, both running on the server.

## Supabase clients

Each client has one job, so it's always clear which permissions a query runs with.

| Client                   | File                     | Acts as                            | Use for                                             |
| ------------------------ | ------------------------ | ---------------------------------- | --------------------------------------------------- |
| `createClient` (browser) | `lib/supabase/client.ts` | the signed-in user, in the browser | Realtime or client-only interactions                |
| `createClient` (server)  | `lib/supabase/server.ts` | the signed-in user (cookies)       | Account pages, cart, Server Actions                 |
| `createPublicClient`     | `lib/supabase/public.ts` | an anonymous visitor               | Catalog reads that can be cached with `"use cache"` |
| `createAdminClient`      | `lib/supabase/admin.ts`  | service role, **bypasses RLS**     | Stripe webhook, seeding, verified-admin operations  |

The server, public and admin clients import `server-only`, so the build fails if a Client Component imports them.

## Caching (Next.js 16 Cache Components)

- Public catalog data is identical for every visitor. It's fetched with the cookie-free public client inside `"use cache"` functions and tagged `catalog` (`src/features/catalog/queries.ts`), so admin edits can refresh it instantly with `updateTag("catalog")`.
- Anything that reads the session cookie (cart count, account menu, orders) renders inside a `<Suspense>` boundary and streams in. The rest of the page is served from the static shell.

## Authentication & authorization

Four independent layers:

1. **Proxy** (`src/proxy.ts`) refreshes the Supabase session on every request and redirects signed-out visitors away from `/account`, `/checkout` and `/admin` (and signed-in users away from `/login` and `/register`). It only verifies the session token's signature. It is a fast first check, not the security boundary.
2. **Pages and data functions** call the Data Access Layer in `src/lib/auth/session.ts`: `requireUser()` for account pages and `requireAdmin()` for admin pages. The admin role is read from the database on every request, so a demoted admin loses access immediately.
3. **Every Server Action** re-checks the user (and the admin role where needed), because actions can be called directly over HTTP.
4. **Row-Level Security** in Postgres is the final guard. Even a buggy query can't read another customer's data.

> **Pitfall: layouts don't protect pages.** Next.js renders a layout and its page in parallel, so a check in `app/admin/layout.tsx` cannot stop `app/admin/page.tsx` from running and sending its output. The admin layout's `AdminGate` only decides what to _show_; every admin page, data function and action calls `requireAdmin()` itself. `tests/admin-pages-guard.test.ts` fails the build if one doesn't.

### Auth flows

| Flow               | How                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Sign up            | `signUp` action → Supabase sends a confirmation email → link opens `/auth/callback`, which exchanges the code for a session |
| Sign in / out      | `signIn` / `signOut` actions; errors never reveal whether an email has an account                                           |
| Forgot password    | `requestPasswordReset` → email link → `/auth/callback?next=/account/password?reset=1` → `updatePassword`                    |
| Return after login | `?next=` is sanitised by `safeRedirectPath()` so it can only point inside the site                                          |

Password rules (10+ characters, upper- and lower-case letters and a digit) are checked by the form schema and enforced again by Supabase Auth (`supabase/config.toml`, pushed with `supabase config push`).

Roles live in `profiles.role`. Sign-up always creates a `customer`. A trigger stops users changing their own role, and admins are promoted only with SQL run by the project owner.

## Catalog, cart and wishlist

- **Filters live in the URL** (`?q=lamp&price=50-150&sort=newest`). `src/features/catalog/filters.ts` parses them leniently, so a hand-edited link falls back to defaults instead of erroring. Search combines Postgres full-text search with a partial-name match.
- **Variant picker:** `src/features/catalog/variants.ts` finds the variant for a selection and marks each choice as available, sold out or nonexistent. Picking a value that doesn't exist with the current choices switches the other options to the closest real combination.
- **Guest carts** live in an httpOnly cookie (`ss_cart`, variant id and quantity only), signed-in carts in `cart_items`. Signing in, signing up or opening an email link merges the guest cart into the account (quantities add up) and clears the cookie, so nothing is lost at the login step before checkout.
- **Cart actions** accept only a variant id and quantity. Price, availability and stock are always re-read from the database.
- **Wishlist** is for signed-in shoppers; guests are sent to sign in and brought back.
- **Reviews** are listed through `get_product_reviews()`, which shows a privacy-safe name ("Ava T.") because profiles are private.

## Money and checkout

- All amounts are integer cents. `lib/pricing/calculate-totals.ts` is the only place totals are computed, on the server, from database prices. The browser sends variant ids, quantities, an address id and a discount code, never prices.
- Checkout (`src/features/checkout`):
  1. `placeOrder` re-reads the cart, checks the address belongs to the shopper and validates the discount code (active, dates, minimum, uses left).
  2. The shopper's earlier unpaid checkouts are settled first (paid if Stripe says so, otherwise their stock is returned), and expired ones are swept.
  3. `reserve_order()` creates a `pending_payment` order and its items and takes the stock **in one transaction**, re-checking every price and quantity. Two shoppers can never buy the last unit, and a price that changed since the cart was totalled is refused.
  4. With a Stripe test key, the shopper pays on Stripe Checkout (line items, shipping, tax, and a one-off coupon for the discount). Card data never touches ShopSphere. Without a key, a clearly labelled **demo mode** confirms the order straight away.
  5. The order becomes `paid` through `mark_order_paid()` (idempotent; counts the discount once; removes the bought items from the cart) only when Stripe's `amount_total` equals the order total. This happens from the signature-verified webhook (`/api/stripe/webhook`, events recorded in `stripe_events`) or from the success page, which asks Stripe directly, so orders are right even before the webhook arrives.
  6. Expired or cancelled sessions call `release_order()`, which returns the stock. A shopper's own unpaid reservation still counts as available to them in the cart.
- Refunds (`refund_order()`, admins only, through a Server Action) work for paid orders that haven't shipped, refund on Stripe first when connected, and return the items to stock.

## Admin

- Every admin page, data function and Server Action calls `requireAdmin()` itself (see the pitfall above); admin writes use the admin's own Supabase client, so RLS and database guards apply too.
- Order status changes go through `guard_order_update()`: paid → processing → shipped (with carrier and tracking number) → delivered. Money and payment fields can't be edited.
- Stock changes go through `adjust_variant_stock()`, which refuses to go below zero and writes `inventory_movements`. Checkout reservations, releases and refunds log their own movements, so the inventory page shows a complete history.
- Product options are edited as text (`Color: Ivory #EEE8DD, Rust #B25A33`); saving creates a variant for every new combination and switches off variants whose combination no longer exists, so order history keeps them.
- Catalog and settings changes call `updateTag("catalog")`, so the cached storefront updates on the next request.
- Analytics (`src/features/admin/analytics`) count paid orders only, compare each figure with the previous period of the same length, and draw revenue per day as columns (sales are discrete days). Charts use one hue, `--color-chart`, the accent nudged richer to pass the dataviz palette validator.

## Security headers

`next.config.ts` sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` on every response. Production builds add:

- **Content-Security-Policy:** scripts only from this site, images and API calls also to `*.supabase.co`, no framing (`frame-ancestors 'none'`), no plugins, forms only to this site. `'unsafe-inline'` scripts are allowed because Next.js's static shell can't carry per-request nonces without making every page dynamic. `upgrade-insecure-requests` is only added on HTTPS deployments.
- **Strict-Transport-Security** for two years, including subdomains.

## Accessibility

axe-core (WCAG 2.1 A/AA plus best practice) reports no violations on the store, account and admin pages. Text colours meet 4.5:1, every page has a skip link and landmarks, forms label every field and announce errors, the variant picker exposes sold-out and unavailable choices to screen readers, and charts have a keyboard-accessible tooltip plus a table view.
