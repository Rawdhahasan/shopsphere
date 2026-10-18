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
