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
import { db } from '@/models/db';          // mobile/models/db.ts
import { ShoppingList } from '@/types/shopping'; // mobile/types/shopping.ts
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
| `mobile/controller/ShoppingListController.ts` | DB operations for shopping lists |
| `mobile/controller/InventoryController.ts` | Sync-aware inventory CRUD + movement log |
| `mobile/controller/ProductController.ts` | Product catalog ops (find-or-create by name) |
| `mobile/models/inventoryMovements.ts` | Append-only inventory movement-log table |
| `mobile/lib/inventory/alerts.ts` | Low-stock / expiry / out-of-stock alert rules |
| `mobile/hooks/useInventory.ts` | Inventory queries + create/update/adjust/delete mutations |
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

## Current State (Phase 4 complete)

- ✅ Monorepo structure
- ✅ SQLite + Drizzle ORM foundation
- ✅ State management — Zustand (UI state, `mobile/store/`) + TanStack Query v5 (`mobile/lib/queryClient.ts`, `mobile/hooks/`)
- ✅ Zod validation schemas in `shared/validation/` (`@clay/shared`) — domain + sync wire format
- ✅ Backend scaffold — Fastify + Drizzle + Postgres connection, `/health` + `/health/db`, migration runner
- ✅ Offline-first schema — `products`, `inventory_items`, `inventory_movements`, `shopping_lists`, `shopping_list_items`, `stores`, `store_prices` + `sync_queue`, all with sync columns (`mobile/models/`)
- ✅ SyncEngine skeleton — push/pull/conflict + outbox (`mobile/lib/sync/`, `mobile/controller/SyncController.ts`); offline-only until Phase 8 transport
- ✅ `useNetworkStatus` + `useSyncStatus` hooks
- ✅ Inventory management — full CRUD, smart alerts (low-stock/expiry/out-of-stock), movement log; sync-aware writes (`mobile/controller/InventoryController.ts`, `mobile/app/(tabs)/inventory.tsx` + `InventoryDetails/`, `mobile/components/inventory/`)
- ✅ Tab navigation (Groceries, List, Inventory)
- 🔄 Shopping list UI (partial — not fully DB-backed; Phase 5 rewrite)
- 🔄 Groceries/product tab UI — still hardcoded (products are auto-created via inventory find-or-create; catalog screen lands later)
- ❌ Backend API (auth, sync transport, feature routes) — not yet (Phase 8)
- ❌ Auth — not yet (Phase 8)

## Phase Checklist

See `docs/Roadmap.md` for the full release plan.
