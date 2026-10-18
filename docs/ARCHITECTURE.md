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

- Public catalog data is identical for every visitor. It's fetched with the cookie-free public client inside `"use cache"` functions and tagged (`cacheTag("products")`), so admin edits can refresh it instantly.
- Anything that reads the session cookie (cart count, account menu, orders) renders inside a `<Suspense>` boundary and streams in. The rest of the page is served from the static shell.

## Authentication & authorization

Four independent layers:

1. **Proxy** (`src/proxy.ts`) refreshes the Supabase session on every request and redirects signed-out visitors away from `/account`, `/checkout` and `/admin`. This is a fast first check only.
2. **Admin layout** calls `requireAdmin()` on the server before rendering (Phase 3).
3. **Every Server Action** re-checks the user (and the admin role where needed), because actions can be called directly over HTTP.
4. **Row-Level Security** in Postgres is the final guard. Even a buggy query can't read another customer's data.

Roles live in `profiles.role`. Sign-up always creates a `customer`. A trigger stops users changing their own role, and admins are promoted only with SQL run by the project owner.

## Money and checkout

- All amounts are integer cents.
- `lib/pricing/calculate-totals.ts` is the only place totals are computed. The browser sends variant IDs and quantities, never prices.
- Checkout flow (Phase 6):
  1. The server validates the cart, loads prices from the database and applies the discount code.
  2. A database function atomically **reserves stock** (`stock >= quantity` or fail) and creates a `pending_payment` order.
  3. The customer pays on Stripe's hosted Checkout page. Card data never touches ShopSphere.
  4. The webhook verifies Stripe's signature, records the event ID (`stripe_events`) so retries are ignored, and marks the order `paid`.
  5. Expired or abandoned sessions release the reserved stock.

## Security headers

`next.config.ts` sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` on every response. A Content Security Policy is added in Phase 11, once all third-party origins are known.
