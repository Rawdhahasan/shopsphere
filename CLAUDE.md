@AGENTS.md

# ShopSphere: project guide

Full-stack e-commerce portfolio project. Read `README.md`, `docs/ARCHITECTURE.md` and `docs/DATABASE.md` before larger changes.

## Working agreement

- Work happens in phases (see README roadmap). Don't start a new phase without the owner's approval.
- Ask before committing, pushing, merging, deploying or creating GitHub repos.
- Never commit `.env*` files with real values. Never ask the owner to paste secrets into chat; they put them in `.env.local` themselves.
- Stripe is test mode only (`sk_test_` keys are enforced in `src/lib/env/server.ts`).
- The owner is learning: explain important decisions in simple language.

## Conventions

- Money is integer cents everywhere. Totals come only from `src/lib/pricing/calculate-totals.ts` on the server.
- Every product has ≥1 variant; price, SKU and stock live on `product_variants`.
- Pick the right Supabase client (`src/lib/supabase/*`). `admin.ts` bypasses RLS: only for webhooks, seeding, or after `requireAdmin()`.
- Cache Components is on: anything reading cookies goes inside `<Suspense>`. Public catalog reads use `createPublicClient()` inside `"use cache"`.
- Server Actions validate input with Zod and re-check auth themselves.
- Schema changes go in a NEW migration file. Add or extend tests in `tests/db/schema.test.ts` for any new rule.
- UI uses the primitives in `src/components/ui` and the tokens in `src/app/globals.css`.

## Commands

- `npm run verify` runs lint, typecheck, tests and build. Run it before proposing a commit.
- Vitest needs `--configLoader runner` (already in the npm scripts) due to a Vite 8 config-bundling issue.
- npm 11.5 corrupts `package-lock.json` on incremental installs (drops `@rolldown/binding-*` platform entries, so `npm ci` fails on Linux CI). After adding or removing a dependency, rebuild the lockfile from a clean folder (`npm install` with only `package.json`) and confirm `grep -c '"node_modules/@rolldown/binding-' package-lock.json` is 15 and a clean `npm ci` succeeds.

## Seed data

- Catalog lives in `supabase/seed/catalog.ts`. `npm run db:seed:generate` writes `supabase/seed.sql` and `docs/IMAGE_CREDITS.md`; never edit those by hand.
- Product photos must be free Unsplash photos (`images.unsplash.com`, not `plus.unsplash.com`), with no visible third-party branding. Credit each one in the catalog.
- `npm run db:seed:images` uploads photos to Storage; `npm run db:seed:demo` creates demo accounts, orders and reviews (needs the `SEED_*` vars in `.env.local`).
