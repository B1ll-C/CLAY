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
| `mobile/controller/ProductController.ts` | Product catalog ops (find-or-create by name **or barcode**) |
| `mobile/models/inventoryMovements.ts` | Append-only inventory movement-log table |
| `mobile/lib/inventory/alerts.ts` | Low-stock / expiry / out-of-stock alert rules |
| `mobile/app/scan/index.tsx` | Barcode scan-flow orchestrator (scan → lookup → add to inventory/list) |
| `mobile/components/scan/BarcodeScanner.tsx` | Reusable `expo-camera` scanner (permission, debounce, timeout) |
| `mobile/hooks/useBarcodeLookup.ts` | Local barcode lookup + save-scanned-product mutations |
| `mobile/hooks/useInventory.ts` | Inventory queries + create/update/adjust/delete mutations |
| `mobile/hooks/useShoppingLists.ts` | Shopping-list queries + list/item/check/restock mutations |
| `mobile/models/_syncColumns.ts` | Sync-metadata mixin spread into every synced table |
| `mobile/lib/sync/SyncEngine.ts` | Push/pull/conflict engine (offline-only until Phase 8) |
| `mobile/controller/SyncController.ts` | `sync_queue` outbox DB operations |
| `mobile/drizzle/` | Generated migration files — do not edit manually |
| `backend/src/index.ts` | Fastify server entry point |
| `shared/types/shopping.ts` | Shared TypeScript types |

## Database

- Local: SQLite via `expo-sqlite` + `drizzle-orm`
- After any schema change in `mobile/models/`: run `npx drizzle-kit generate` from `mobile/`
- Migrations run automatically in `app/_layout.tsx` via `useMigrations`
- All tables include sync columns: `sync_status`, `server_id`, `version` (Phase 3+)

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
- ✅ Backend scaffold — Fastify + Drizzle + Postgres connection, `/health` + `/health/db`, migration runner
- ✅ Offline-first schema — `products`, `inventory_items`, `inventory_movements`, `shopping_lists`, `shopping_list_items`, `stores`, `store_prices` + `sync_queue`, all with sync columns (`mobile/models/`)
- ✅ SyncEngine skeleton — push/pull/conflict + outbox (`mobile/lib/sync/`, `mobile/controller/SyncController.ts`); offline-only until Phase 8 transport
- ✅ `useNetworkStatus` + `useSyncStatus` hooks
- ✅ Inventory management — full CRUD, smart alerts (low-stock/expiry/out-of-stock), movement log; sync-aware writes (`mobile/controller/InventoryController.ts`, `mobile/app/(tabs)/inventory.tsx` + `InventoryDetails/`, `mobile/components/inventory/`)
- ✅ Tab navigation (Groceries, List, Inventory, Prices)
- ✅ Shopping lists — DB-backed multi-list CRUD, freeform/checkable items, "Add low-stock items" restock from inventory alerts, bulk check/clear; sync-aware writes (`mobile/controller/ShoppingListController.ts`, `mobile/hooks/useShoppingLists.ts`, `mobile/app/(tabs)/list.tsx` + `ListDetails/`, `mobile/components/shopping/`)
- ✅ Barcode scanner — `expo-camera` scan flow (`mobile/app/scan/`, `mobile/components/scan/`), local SQLite barcode lookup, offline skeleton-product creation, add-to-inventory/list; remote Open Food Facts lookup deferred to Phase 8. **Requires a native rebuild** (`npx expo run:android`) for the camera module.
- ✅ Price comparison — stores + per-product price tracking, side-by-side comparison, "cheapest basket" optimizer (`minimize_cost`/`minimize_trips`); sync-aware writes (`mobile/controller/StoreController.ts`, `mobile/controller/PriceController.ts`, `mobile/hooks/useStores.ts`, `mobile/hooks/usePrices.ts`, `mobile/app/(tabs)/prices.tsx` + `PricesDetails/`, `mobile/components/pricing/`). Backend price/store routes deferred to Phase 8.
- 🔄 Groceries/product tab UI — still hardcoded (products are auto-created via inventory find-or-create / barcode scan; catalog screen lands later)
- ✅ Backend Postgres schema — `users`, `sync_log` + `user_id`-owned domain tables, docker-compose for local Postgres+Redis (`backend/src/db/schema/`, Phase 8 PR #8)
- ✅ Auth — JWT access tokens + Redis-backed opaque refresh tokens, bcrypt, `requireAuth` middleware (`backend/src/services/AuthService.ts`, `backend/src/middleware/auth.ts`, Phase 8 PR #9)
- 🔄 Sync API — generic push/pull routes (`backend/src/routes/sync.ts`, `backend/src/services/SyncService.ts`) in progress, not yet merged (Phase 8)
- ❌ Barcode API (Open Food Facts + Redis cache), background workers, mobile auth/sync wiring — not yet (Phase 8)

## Phase Checklist

See `docs/Roadmap.md` for the full release plan.
