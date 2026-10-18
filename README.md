# ShopSphere

A full-stack e-commerce platform for modern home and lifestyle goods, with a premium customer storefront and a complete admin dashboard.

> **Status:** in active development. Phases 1–2 (architecture, design system, database, seed data) are complete. See the [roadmap](#roadmap).
> Payments run in **Stripe test mode only**. No real charges are ever made.

## Highlights

- **Next.js 16 App Router** with Cache Components, Server Components and Server Actions
- **Product variants** (color, size, material) with per-variant price, SKU and inventory
- **Defence-in-depth security**: route proxy, server-side authorization, and Postgres **Row-Level Security** on every table
- **Server-side pricing**: totals, discounts, shipping and tax are always recalculated on the server from database prices
- **Safe payments**: Stripe Checkout with signature-verified, idempotent webhooks and atomic stock reservation
- **Tested database rules**: 45+ tests run every migration and the seed data in an in-memory Postgres and verify what each type of user can and can't do
- **Realistic seed data**: 24 products with 49 variants, licensed photography, demo customers, orders and reviews

## Tech stack

| Layer      | Technology                                                            |
| ---------- | --------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19, TypeScript (strict)                |
| Styling    | Tailwind CSS v4, custom design tokens, Fraunces + Geist typefaces     |
| Data       | Supabase Postgres with Row-Level Security                             |
| Auth       | Supabase Auth (email + password, cookie sessions via `@supabase/ssr`) |
| Files      | Supabase Storage                                                      |
| Payments   | Stripe Checkout (test mode)                                           |
| Validation | Zod, React Hook Form                                                  |
| Testing    | Vitest, Testing Library, PGlite (in-memory Postgres)                  |
| Hosting    | Vercel                                                                |

## Getting started

### Prerequisites

- Node.js 24+ (`node --version`)
- A free [Supabase](https://supabase.com) project (from Phase 2)
- A free [Stripe](https://stripe.com) account in test mode (from Phase 6)

### Install and run

```bash
npm install
cp .env.example .env.local   # then fill in your values
npm run dev                  # http://localhost:3000
```

The app starts without any credentials. Features that need Supabase or Stripe switch on once their variables are set.

### Environment variables

All variables are documented in [`.env.example`](.env.example).

| Variable                                                        | Where it's used   | Secret?                       |
| --------------------------------------------------------------- | ----------------- | ----------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                          | Browser + server  | No                            |
| `NEXT_PUBLIC_SUPABASE_URL`                                      | Browser + server  | No                            |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                          | Browser + server  | No (protected by RLS)         |
| `SUPABASE_SECRET_KEY`                                           | Server only       | **Yes**                       |
| `SUPABASE_DB_PASSWORD`                                          | Supabase CLI only | **Yes**                       |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_DEMO_PASSWORD` | Seed scripts only | **Yes** (passwords)           |
| `STRIPE_SECRET_KEY`                                             | Server only       | **Yes** (must be `sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET`                                         | Server only       | **Yes**                       |

Secret values are validated at runtime and imported only from `server-only` modules, so the build fails if one is ever pulled into browser code.

## Scripts

| Command                    | What it does                                      |
| -------------------------- | ------------------------------------------------- |
| `npm run dev`              | Start the development server                      |
| `npm run build`            | Production build                                  |
| `npm run lint`             | ESLint                                            |
| `npm run typecheck`        | Generate route types and run the TypeScript check |
| `npm test`                 | Unit, component and database tests                |
| `npm run verify`           | lint + typecheck + test + build (same as CI)      |
| `npm run db:link`          | Link the Supabase CLI to your project             |
| `npm run db:push`          | Apply migrations to the linked Supabase project   |
| `npm run db:types`         | Generate TypeScript types from the database       |
| `npm run db:seed:generate` | Rebuild `supabase/seed.sql` from the catalog      |
| `npm run db:seed:images`   | Upload catalog photos to Supabase Storage         |
| `npm run db:seed:demo`     | Create demo accounts, orders, reviews and carts   |

### Setting up a fresh database

```bash
npm run db:link                          # once
npx supabase db push --include-seed      # schema + catalog
npm run db:seed:images                   # product photos
npm run db:seed:demo                     # demo admin, customers, orders
```

The demo script creates `SEED_ADMIN_EMAIL` as the admin and four customers (`ava.thompson@shopsphere.example`, `noah.bennett@…`, `mia.laurent@…`, `liam.okafor@…`) using the passwords in `.env.local`. All seed steps are safe to re-run: they never overwrite catalog or settings changes made later.

## Project structure

```
src/
  app/
    (store)/          Customer storefront (homepage, catalog, cart, account…)
    admin/            Admin dashboard
  components/
    ui/               Design-system primitives (Button, Input, FormField, Badge…)
    layout/           Storefront header and footer
    admin/            Admin shell components
  config/             Site and navigation configuration
  lib/
    env/              Validated environment variables (public vs server-only)
    supabase/         Supabase clients: browser, server (user), public (cacheable), admin
    stripe/           Server-only Stripe client
    pricing/          Order total calculation, the single source of truth
    auth/             Route protection helpers
  proxy.ts            Session refresh and route protection (Next.js 16 "Proxy")
supabase/
  migrations/         Schema, triggers, RLS policies, storage
tests/
  db/                 Database security tests (PGlite)
docs/                 Architecture and database documentation
```

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/DATABASE.md](docs/DATABASE.md)

## Roadmap

- [x] **Phase 1:** Project setup, architecture, design system, database schema
- [x] **Phase 2:** Supabase project, migrations applied, seed data and product imagery
- [ ] **Phase 3:** Authentication, customer profiles, addresses, admin authorization
- [ ] **Phase 4:** Storefront catalog: homepage, listing, search, filters, product pages
- [ ] **Phase 5:** Cart (guest + signed-in, merged on login) and wishlist
- [ ] **Phase 6:** Checkout with Stripe, webhooks, stock reservation, discount codes
- [ ] **Phase 7:** Order history and tracking, ratings and reviews
- [ ] **Phase 8:** Admin: products and variants, categories, inventory
- [ ] **Phase 9:** Admin: orders, customers, discounts, review moderation, settings
- [ ] **Phase 10:** Revenue analytics dashboard
- [ ] **Phase 11:** End-to-end tests, accessibility and performance pass
- [ ] **Phase 12:** Production deployment on Vercel

## License

Source code © Rawdha Hasan. Product photography is from Unsplash, used under the Unsplash License; photographers are credited in [docs/IMAGE_CREDITS.md](docs/IMAGE_CREDITS.md).
