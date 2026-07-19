# CLAY — Release Roadmap

See `docs/Phases.md` for the detailed, as-built account of each phase (goals, deliverables, deviations, PRs). This file tracks release-level status only.

## MVP (~25 dev days) — ✅ Complete

Offline-capable single-user app. No backend required.

| Phase | Feature | Effort | Status |
|---|---|---|---|
| 1 | Monorepo restructure | 2d | ✅ |
| 2 | Architecture foundation (Zustand, React Query, Zod) | 3d | ✅ |
| 3 | Offline schema + SyncEngine skeleton | 5d | ✅ |
| 4 | Inventory management | 8d | ✅ |
| 5 | Shopping list rewrite | 6d | ✅ |
| 7 | Barcode scanner | 4d | ✅ |

## V1 (~20 additional dev days) — ✅ Complete

Adds backend, authentication, cross-device sync, and price comparison.

| Phase | Feature | Effort | Status |
|---|---|---|---|
| 6 | Price comparison module | 6d | ✅ |
| 8 | Backend (Fastify + Postgres + auth + sync + barcode API + background workers + mobile auth/sync wiring) | 6d | ✅ |
| 9 | Performance optimization | 3d | ⏸ Deferred → runs **last in V2** (pure optimization, no feature work — moving it after V2 lets the index/tuning pass cover V2 tables too) |
| 11 | Testing & CI infrastructure (Vitest, Jest/RNTL, Maestro E2E, GitHub Actions CI + release-branch automation) — not in the original phase count, added once there was enough surface area to test | — | ✅ |
| — | Integration + QA | 5d | 🔄 Ongoing |

The backend on `develop` is Supabase-hosted (Postgres + Auth) — `feat/supabase-backend` was merged via GitHub PR #14, replacing Phase 8's original local-Postgres + bcrypt/JWT/Redis-refresh-token auth. Drizzle and all mobile-facing routes were unchanged by that swap — see `docs/Supabase.md`.

## V2 (~28 additional dev days) — 📋 Planned

Full detail, user stories, and the trackable feature checklist live in **`docs/PRD-V2.md`**. Priority-ordered:

| Priority | Phase | Feature | Effort | Status |
|---|---|---|---|---|
| P0 | 12 | Household / family list sharing | 8d | ⬜ Not started |
| P1 | 13 | Push notifications (local alerts + household push) | 5d | ⬜ Not started |
| P2 | 14 | Spending analytics | 5d | ⬜ Not started |
| P3 | 15 | Receipt scanning (OCR → auto-update prices) | 7d | ⬜ Not started |
| P4 | 9 | Performance optimization (deferred from V1, runs last) | 3d | ⬜ Not started |

## Future

- AI shopping list suggestions
- Grocery delivery API integrations
- Apple Watch glance
