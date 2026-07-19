# CLAY — Claude Code Guide

## Monorepo Structure

```
/
├── mobile/       Expo React Native app (primary development target)
├── backend/      Node.js Fastify API (Phase 8+)
├── shared/       Shared types, constants, Zod validation
├── docs/         Architecture, PRD, BRD, roadmap
├── CLAUDE.md     ← you are here
└── Design.md     Design system reference
```

All Claude-facing documents (CLAUDE.md, Design.md, PRINCIPLES.md) live at the **repository root**.

## Working in mobile/

Commands run from `mobile/`:
```bash
npx expo start          # start dev server
npx expo run:android    # run on Android
npx tsc --noEmit        # type-check
npx drizzle-kit generate  # generate migrations after schema changes
```

Or from the workspace root:
```bash
npm run start           # proxies to mobile/ expo start
npm run android         # proxies to mobile/ expo run:android
```

## Path Aliases

The `@/*` alias inside `mobile/` maps to `mobile/` itself.

```typescript
import { db } from '@/models/db';                 // mobile/models/db.ts
import { ShoppingListController } from '@/controller/ShoppingListController'; // mobile/controller/…
```

Shared package imports (Phase 2+):
```typescript
import { ProductCategory } from '@clay/shared/constants/categories';
```

## Key Files

| File | Purpose |
|---|---|
| `mobile/app/_layout.tsx` | Root layout — SQLite init, Drizzle migrations, providers |
| `mobile/models/db.ts` | Drizzle ORM + expo-sqlite instance |
| `mobile/models/index.ts` | Schema exports (used by drizzle.config.ts) |
| `mobile/controller/ShoppingListController.ts` | Sync-aware multi-list CRUD + items + inventory-alert restock |
| `mobile/controller/InventoryController.ts` | Sync-aware inventory CRUD + movement log |
| `mobile/controller/ProductController.ts` | Product catalog ops (find-or-create by name **or barcode**, plus direct create/update/soft-delete for the Groceries tab) |
| `mobile/app/(tabs)/product.tsx` | Groceries tab — catalog search/filter/browse |
| `mobile/models/inventoryMovements.ts` | Append-only inventory movement-log table |
| `mobile/lib/inventory/alerts.ts` | Low-stock / expiry / out-of-stock alert rules |
| `mobile/app/scan/index.tsx` | Barcode scan-flow orchestrator (scan → lookup → add to inventory/list) |
| `mobile/components/scan/BarcodeScanner.tsx` | Reusable `expo-camera` scanner (permission, debounce, timeout) |
| `mobile/hooks/useBarcodeLookup.ts` | Local barcode lookup + save-scanned-product mutations |
| `mobile/hooks/useInventory.ts` | Inventory queries + create/update/adjust/delete mutations |
| `mobile/hooks/useShoppingLists.ts` | Shopping-list queries + list/item/check/restock mutations |
| `mobile/models/_syncColumns.ts` | Sync-metadata mixin spread into every synced table |
| `mobile/lib/sync/SyncEngine.ts` | Push/pull/conflict engine |
| `mobile/lib/sync/HttpSyncTransport.ts` | `SyncTransport` over `/api/v1/sync/push|pull`, Bearer auth + silent refresh-and-retry on 401 |
| `mobile/controller/SyncController.ts` | `sync_queue` outbox DB operations |
| `mobile/store/authStore.ts` | Zustand auth session store — register/login/logout, token rotation |
| `mobile/drizzle/` | Generated migration files — do not edit manually |
| `backend/src/index.ts` | Fastify server entry point |
| `backend/src/services/BarcodeService.ts` | Barcode lookup: Redis cache → Postgres `products` → Open Food Facts fallback |
| `backend/src/workers/CleanupWorker.ts` | BullMQ nightly cron — purges soft-deleted rows older than 90 days |
| `backend/src/worker.ts` | Standalone background-worker process entry point (`npm run worker`, separate from the HTTP server) |
| `backend/src/lib/supabase.ts` | Supabase clients (anon-key + admin) and JWKS set — `feat/supabase-backend` only, see `docs/Supabase.md` |
| `shared/types/shopping.ts` | Shared TypeScript types |

## Database

- Local: SQLite via `expo-sqlite` + `drizzle-orm`
- After any schema change in `mobile/models/`: run `npx drizzle-kit generate` from `mobile/`
- Migrations run automatically in `app/_layout.tsx` via `useMigrations`
- All tables include sync columns: `sync_status`, `server_id`, `version` (Phase 3+)

## Testing

**Before committing a feature, add the test coverage that applies to what changed:**
- **Unit** — new pure logic (controllers' business rules, `mobile/lib/**` helpers, backend `services/**` helpers) gets a unit test alongside it.
- **Integration** — a new/changed backend route or DB-touching flow gets a test that exercises it through `buildApp().inject()` (or the real controller against SQLite for mobile), not just the pure-logic pieces in isolation.
- **E2E** — a new or changed user-facing screen/flow gets (or an existing Maestro flow is updated to cover) the path a user actually takes through it.
A pure docs/chore change doesn't need any of these; a bugfix needs at minimum a regression test for the layer the bug lived in.

| Layer | Where | Run |
|---|---|---|
| Mobile unit | `mobile/**/*.test.ts(x)`, colocated with the code under test | `npm test --workspace=mobile` |
| Backend unit + integration | `backend/src/**/*.test.ts`, colocated with the code under test | `npm test --workspace=backend` |
| Mobile E2E | `mobile/.maestro/*.yaml` | `npm run test:e2e --workspace=mobile` |

**Mobile unit** — Jest via the `jest-expo` preset + `@testing-library/react-native` (RNTL) v14. RNTL v14 made `render`, `rerender`, `unmount`, and every `fireEvent.*` call **async** (React 19 / New Architecture support) — `await` them, or the query methods on `screen` throw `` `render` function has not been called `` even though render did run. `@/*` is mapped to `mobile/` via `moduleNameMapper` in `mobile/package.json`'s `jest` block, matching the app's own path alias.

**Backend unit + integration** — Vitest, configured in `backend/vitest.config.ts`. Integration tests build the real Fastify app via `buildApp()` (`backend/src/app.ts`, kept separate from `index.ts`'s `.listen()` for exactly this) and hit routes with `.inject()` — no real port, no separate test server process. `vitest.config.ts` loads `dotenv/config` as a setup file so routes that read env vars at import time (e.g. `AuthService` → `lib/supabase.ts`) work the same as they do under `npm run dev`.

**Mobile E2E** — [Maestro](https://maestro.mobile.dev), a standalone CLI (not an npm package): install via `curl -Ls "https://get.maestro.mobile.dev" | bash`. Flows live in `mobile/.maestro/` and target `appId: com.anonymous.CLAY` against an already-built app (dev client or APK — see the barcode scanner's native-rebuild note above) on a running emulator/device. `smoke-launch.yaml` needs no setup. `add-product.yaml` logs into a real Supabase-backed account and needs a seeded test user: `maestro test --env TEST_EMAIL=... --env TEST_PASSWORD=... mobile/.maestro/add-product.yaml`. Interactive elements Maestro flows target carry an explicit `testID` (e.g. `login-email-input`, `add-product-fab`, `product-save-button`) — add one when a new flow needs to target an element that doesn't have a stable, unique visible label.

## Design System

Color palette (sage green theme):
- Primary: `#8FB996` (sage green)
- Primary dark: `#557C55` (olive)
- Primary light: `#E6F4EA` (mint cream)
- Accent peach: `#F7C8A0`
- Accent mustard: `#E6C368`

See `mobile/tailwind.config.js` for full theme. Use NativeWind Tailwind classes in all components.

## Current State (Phases 1-7 complete — MVP + Phase 6 offline feature set complete)

- ✅ Monorepo structure
- ✅ SQLite + Drizzle ORM foundation
- ✅ State management — Zustand (UI state, `mobile/store/`) + TanStack Query v5 (`mobile/lib/queryClient.ts`, `mobile/hooks/`)
- ✅ Zod validation schemas in `shared/validation/` (`@clay/shared`) — domain + sync wire format
- ✅ Backend scaffold — Fastify + Drizzle + Postgres connection (Supabase-hosted on `feat/supabase-backend`, see `docs/Supabase.md`), `/health` + `/health/db`, migration runner
- ✅ Offline-first schema — `products`, `inventory_items`, `inventory_movements`, `shopping_lists`, `shopping_list_items`, `stores`, `store_prices` + `sync_queue`, all with sync columns (`mobile/models/`)
- ✅ SyncEngine — push/pull/conflict + outbox (`mobile/lib/sync/`, `mobile/controller/SyncController.ts`), live over HTTP via `HttpSyncTransport` (Phase 8 PR #19)
- ✅ `useNetworkStatus` + `useSyncStatus` hooks
- ✅ Inventory management — full CRUD, smart alerts (low-stock/expiry/out-of-stock), movement log; sync-aware writes (`mobile/controller/InventoryController.ts`, `mobile/app/(tabs)/inventory.tsx` + `InventoryDetails/`, `mobile/components/inventory/`)
- ✅ Tab navigation (Groceries, List, Inventory, Prices)
- ✅ Shopping lists — DB-backed multi-list CRUD, freeform/checkable items, "Add low-stock items" restock from inventory alerts, bulk check/clear; sync-aware writes (`mobile/controller/ShoppingListController.ts`, `mobile/hooks/useShoppingLists.ts`, `mobile/app/(tabs)/list.tsx` + `ListDetails/`, `mobile/components/shopping/`)
- ✅ Barcode scanner — `expo-camera` scan flow (`mobile/app/scan/`, `mobile/components/scan/`), local SQLite barcode lookup, offline skeleton-product creation, add-to-inventory/list; remote Open Food Facts lookup deferred to Phase 8. **Requires a native rebuild** (`npx expo run:android`) for the camera module.
- ✅ Price comparison — stores + per-product price tracking, side-by-side comparison, "cheapest basket" optimizer (`minimize_cost`/`minimize_trips`); sync-aware writes (`mobile/controller/StoreController.ts`, `mobile/controller/PriceController.ts`, `mobile/hooks/useStores.ts`, `mobile/hooks/usePrices.ts`, `mobile/app/(tabs)/prices.tsx` + `PricesDetails/`, `mobile/components/pricing/`). Backend price/store routes deferred to Phase 8.
- ✅ Groceries/product catalog tab — real SQLite-backed catalog browse/search/category-filter, manual add/edit/soft-delete, links out to Prices; sync-aware writes (`mobile/controller/ProductController.ts`, `mobile/hooks/useProducts.ts`, `mobile/app/(tabs)/product.tsx` + `ProductDetails/[id].tsx`, `mobile/components/ProductCard.tsx`, `mobile/components/product/ProductFormModal.tsx`). No phase number assigned; backend product routes remain covered by the existing Phase 8 barcode-lookup API.
- ✅ Backend Postgres schema — `users`, `sync_log` + `user_id`-owned domain tables (`backend/src/db/schema/`, Phase 8 PR #8). On `develop`, docker-compose runs local Postgres+Redis; on `feat/supabase-backend`, Postgres is a hosted Supabase project instead (docker-compose only runs Redis) and `users` FKs to Supabase's `auth.users` — see `docs/Supabase.md`.
- ✅ Auth — `requireAuth` middleware (`backend/src/middleware/auth.ts`) unchanged across branches. On `develop`: JWT access tokens + Redis-backed opaque refresh tokens, bcrypt (`backend/src/services/AuthService.ts`, Phase 8 PR #9). On `feat/supabase-backend`: `AuthService` proxies Supabase Auth instead (JWKS-verified tokens, Supabase-managed refresh rotation) — same `AuthTokens` shape and routes, so mobile is identical either way.
- ✅ Sync API — generic push/pull routes (`backend/src/routes/sync.ts`, `backend/src/services/SyncService.ts`) (Phase 8 PR #10)
- ✅ Barcode API — `GET /api/v1/products/barcode/:code`, Redis cache → Postgres → Open Food Facts fallback (`backend/src/routes/products.ts`, `backend/src/services/BarcodeService.ts`) (Phase 8 PR #11)
- ✅ Background workers — BullMQ `CleanupWorker` (nightly cron, purges soft-deletes >90d) + standalone worker process (`backend/src/lib/queue.ts`, `backend/src/workers/CleanupWorker.ts`, `backend/src/worker.ts`) (Phase 8 PR #18)
- ✅ Mobile auth/sync wiring — `SecureTokenStore` + `AuthClient`/`authStore` (Zustand) against the backend auth routes, `(auth)/login` + `register` screens, `AuthBootstrap` in `app/_layout.tsx` lights up `HttpSyncTransport` on sign-in and gates `(tabs)` behind sign-in (Phase 8 PR #19)

## Phase Checklist

See `docs/Roadmap.md` for the full release plan.
