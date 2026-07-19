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
| 9 | Performance optimization | 3d | ⬜ Not started |
| 11 | Testing & CI infrastructure (Vitest, Jest/RNTL, Maestro E2E, GitHub Actions CI + release-branch automation) — not in the original phase count, added once there was enough surface area to test | — | ✅ |
| — | Integration + QA | 5d | 🔄 Ongoing (see Phase 9, and `feat/supabase-backend` below) |

`feat/supabase-backend` replaces Phase 8's local Postgres + bcrypt/JWT/Redis-refresh-token auth with hosted Supabase (Postgres + Auth); Drizzle and all mobile-facing routes are unchanged. It's an **alternative, unmerged branch** to the `develop` backend above, not additional scope — see `docs/Supabase.md`.

## V2 (~30 additional dev days)

| Feature |
|---|
| Household / family list sharing |
| Push notifications (low-stock, expiry) |
| Receipt scanning (OCR → auto-update prices) |
| Spending analytics |

## Future

- AI shopping list suggestions
- Grocery delivery API integrations
- Apple Watch glance
