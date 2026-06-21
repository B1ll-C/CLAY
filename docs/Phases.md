# CLAY — Implementation Phases Reference

**Date:** 2026-06-21
**Total estimated effort:** ~43 dev days
**MVP cutoff:** Phases 1, 2 (partial), 3, 4, 5, 7 — ~25 days, offline single-user
**V1 cutoff:** Adds Phases 6, 8 — ~20 additional days, backend + sync + price comparison

---

## Phase 1 — Repository Restructure

**Status:** ✅ Complete
**Branch:** `feature/monorepo-restructure`
**Effort:** 2 days

### Goal
Establish a clean monorepo separating the mobile app, backend, and shared code. All Claude-facing documents live at the repository root.

### Deliverables
| Artifact | Status |
|---|---|
| All Expo source moved to `mobile/` | ✅ |
| Root npm workspace config | ✅ |
| `mobile/metro.config.js` updated for workspace resolution | ✅ |
| `backend/` scaffold (Fastify, health route) | ✅ |
| `shared/` scaffold (types, constants, validation stub) | ✅ |
| `docs/` structure with all planning documents | ✅ |
| `CLAUDE.md` and `Design.md` at repo root | ✅ |
| Phase 1 migration checklist | ✅ |
| `npm install` at workspace root | ⬜ user action |
| TypeScript validation (`tsc --noEmit`) | ⬜ user action |

### Target Structure
```
/
├── mobile/       Expo React Native app
├── backend/      Node.js Fastify API
├── shared/       Shared types, constants, Zod validation
├── docs/
├── CLAUDE.md
└── Design.md
```

### Key Config Changes
- `mobile/metro.config.js` — `watchFolders` + `nodeModulesPaths` added so Metro resolves `@clay/shared` hoisted to workspace root
- `mobile/package.json` — renamed to `@clay/mobile`; stale `reset-project` script removed; `@clay/shared: "*"` dependency added
- Root `package.json` — workspace config with proxy scripts for `npm run start`, `npm run android`, etc.

### Risks
| Risk | Mitigation |
|---|---|
| Metro cannot resolve `shared/` | `watchFolders` + `nodeModulesPaths` in metro.config.js |
| Drizzle CLI breaks from path changes | Paths are relative inside `mobile/` — no change needed |
| Android build breaks from moved `android/` | Full rename tracked by git; test before EAS build |

### Pull Requests
- PR 1: `feature/monorepo-restructure` → `main`

---

## Phase 2 — Architecture Foundation

**Status:** ✅ Complete
**Effort:** 3 days

### Goal
Wire the global state management, server-state cache, and validation layers so all future features have a consistent data-fetching and UI-state pattern to build on.

### Deliverables
- Zustand installed — global store for UI-only state (modal visibility, active tab, filters)
- TanStack Query v5 installed — `QueryClientProvider` wrapping the root layout
- Zod installed in `shared/` — validation schemas shared between mobile forms and backend request bodies
- Fastify backend scaffold connected to a local PostgreSQL database (health route confirmed working)
- `backend/src/db/` — Drizzle ORM + PostgreSQL connection and migration runner
- `docs/Architecture.md` updated to reflect installed stack

### Dependencies
- Phase 1 complete and `npm install` run at workspace root

### Stack Decisions
| Concern | Choice | Rationale |
|---|---|---|
| UI state | Zustand | Minimal boilerplate, no context hell, React Native friendly |
| Server state | TanStack Query v5 | Built-in offline support, optimistic updates, background refetch |
| Validation | Zod | Shared between mobile and backend via `@clay/shared` |
| Backend DB | PostgreSQL + Drizzle ORM | Consistent ORM across mobile (SQLite) and backend (Postgres) |

### Acceptance Criteria
- ✅ Zustand, TanStack Query v5, and Zod installed; mobile type-check clean (no new errors)
- ✅ `useShoppingLists()` React Query hook added (`mobile/hooks/`); `QueryClientProvider` wraps the root layout
- ✅ Zod schemas import and execute from `@clay/shared` in both mobile (tsc) and backend (tsx runtime)
- ✅ Backend boots without a DB: `GET /health` → 200, `GET /health/db` → 503 until `DATABASE_URL` is set
- ✅ Backend migration generated offline (`drizzle/0000_flimsy_ares.sql`); applied via `npm run db:migrate`

### Pull Requests
- PR 2: `feat/state-management-foundation` — Zustand, React Query, Zod providers wired ✅
- PR 3: `feat/backend-scaffold` — Fastify + PostgreSQL + Drizzle ORM + health routes ✅

---

## Phase 3 — Offline-First Foundation

**Status:** ✅ Core complete (offline-only; backend transport deferred to Phase 8)
**Effort:** 5 days

### Goal
Every table in the app carries sync metadata. A SyncEngine handles push, pull, and conflict resolution so the app functions identically online and offline.

### Deliverables
- New Drizzle schema files for all core tables (with sync columns)
- `SyncEngine.ts` — push, pull, conflict methods
- `mobile/hooks/useNetworkStatus.ts` — detects connectivity changes
- `mobile/hooks/useSyncStatus.ts` — exposes last-synced time and pending count to the UI
- `docs/OfflineStrategy.md` filled out
- `docs/SyncEngine.md` filled out
- Drizzle migration generated and wired into `_layout.tsx`

### Sync Columns (added to every table)
| Column | Type | Purpose |
|---|---|---|
| `sync_status` | text | `synced` / `pending_create` / `pending_update` / `pending_delete` |
| `server_id` | text | null until first successful push |
| `version` | integer | incremented on every update; used for conflict detection |
| `last_synced_at` | timestamp | confirmed sync timestamp |

### Full Schema

**`products`**
```
id, server_id, name, brand, category, barcode, sku, unit,
notes, image_url, is_active,
sync_status, version, created_at, updated_at, deleted_at
```

**`inventory_items`**
```
id, server_id, product_id → products,
quantity, unit, expiration_date, location (pantry/fridge/freezer),
min_quantity, cost_per_unit, notes,
sync_status, version, created_at, updated_at, deleted_at
```

**`shopping_lists`**
```
id, server_id, title, is_shared,
sync_status, version, created_at, updated_at, deleted_at
```

**`shopping_list_items`**
```
id, server_id, list_id → shopping_lists, product_id → products (nullable),
name, quantity, unit, is_checked, notes, sort_order,
sync_status, version, created_at, updated_at, deleted_at
```

**`stores`**
```
id, server_id, name, address,
sync_status, created_at
```

**`store_prices`**
```
id, server_id, product_id → products, store_id → stores,
price, unit, promotion_price, promotion_expires_at, last_verified_at,
sync_status, version, created_at, updated_at
```

**`sync_queue`**
```
id, table_name, record_id, operation (CREATE/UPDATE/DELETE),
payload (JSON), retry_count, last_error, created_at, processed_at
```

### SyncEngine Design
```
SyncEngine
  .sync()                — full push + pull cycle; called on foreground, reconnect, manual refresh
  .pushChanges()         — drain sync_queue; send to POST /api/v1/sync/push
  .pullChanges(since)    — fetch GET /api/v1/sync/pull?since=
  .resolveConflict()     — server wins per field; notify user if server deleted a locally-edited record
  .processSyncQueue()    — retry up to 10 times; skip entries older than 30 days
```

### Conflict Resolution Rules
| Scenario | Rule |
|---|---|
| Same field edited locally and on server | Server wins (last-write-wins per field) |
| Item deleted on server, edited locally | Server delete wins; notify user |
| Item created locally while offline | Push to server; assign `server_id` on success |
| Duplicate barcode scanned offline | Merge into existing product; keep higher quantity |

### Dependencies
- Phase 2 complete (React Query wired)

### Pull Requests
- PR 4: `feat/offline-schema` — all Drizzle schema files + migrations
- PR 5: `feat/sync-engine` — SyncEngine class, useNetworkStatus, useSyncStatus

---

## Phase 4 — Inventory Management

**Status:** ✅ Mobile complete (offline-only) — `feat/inventory-management` (GitHub PR #4 → `develop`); backend inventory routes deferred to Phase 8
**Effort:** 8 days (5 mobile + 3 backend)

> **As built — deviations from the original plan below:**
> - Movement log table is **`inventory_movements`** (not `movement_log`), and is a **synced table** (sync columns + an entry in shared `SYNCED_TABLES`); reasons are `initial / purchase / consume / waste / adjust`.
> - Detail/edit/add use one tab-nested route plus modals — `app/(tabs)/InventoryDetails/[id].tsx`, `InventoryFormModal` (add/edit), `InventoryAdjustModal` (stock change) — instead of separate `app/inventory/[id].tsx` and `add.tsx` routes.
> - Products are created on demand via `ProductController.findOrCreateByName` (type a name); barcode-driven add lands in Phase 7.
> - Alert logic is a pure module (`lib/inventory/alerts.ts`) reused by badges/filter/counts, not a `useInventoryAlerts` hook.
> - Expiration uses a `YYYY-MM-DD` text field (no native date picker) to avoid a native module + Android rebuild.
> - Backend ("inventory-api") is **not** in this PR — per the MVP cutoff it ships with the Phase 8 sync transport.

### Goal
Full inventory CRUD with expiration tracking, stock movement history, and smart alerts — working completely offline.

### User Stories
- Add a product to inventory by scanning its barcode or entering manually
- Set a minimum quantity threshold; receive a low-stock alert when crossed
- Record expiration dates; see what is expiring within 7 days
- View a timeline of every stock movement (purchased, consumed, adjusted)
- All of the above with zero network connectivity

### Screens
| Screen | Route |
|---|---|
| Inventory list | `mobile/app/(tabs)/inventory.tsx` |
| Item detail + history | `mobile/app/(tabs)/InventoryDetails/[id].tsx` |
| Add / edit item | `InventoryFormModal` (modal, no route) |
| Adjust stock | `InventoryAdjustModal` (modal, no route) |

### Add / Edit Fields
```
Product          — searchable picker or barcode scan
Quantity         — numeric stepper
Unit             — each / kg / lb / oz / g / L / mL
Storage Location — Pantry / Fridge / Freezer / Other
Expiration Date  — date picker (optional)
Min Quantity     — alert threshold
Cost per Unit    — optional, used in price comparison
Notes            — freeform
```

### Smart Alerts
| Type | Trigger | Display |
|---|---|---|
| Low Stock | `quantity <= min_quantity` | Yellow badge on Inventory tab + list filter |
| Expiring Soon | `expiration_date <= now + 7 days` | Orange badge |
| Expired | `expiration_date < now` | Red badge |
| Out of Stock | `quantity <= 0` | Grayed-out card |

### Stock Movement Log
Every quantity change writes a row to `inventory_movements` (append-only, synced):
```
id, inventory_item_id → inventory_items, delta (+added / -consumed),
resulting_quantity, reason (initial / purchase / consume / waste / adjust),
notes, + sync columns (server_id, sync_status, version,
last_synced_at, created_at, updated_at, deleted_at)
```
Written on the opening balance (`initial`), form edits that change quantity
(`adjust`), and explicit adjustments; shown as the history timeline on the item
detail screen.

### Backend API Contracts
```
GET    /api/v1/inventory              paginated list
POST   /api/v1/inventory              create item
GET    /api/v1/inventory/:id          single item
PUT    /api/v1/inventory/:id          update item
DELETE /api/v1/inventory/:id          soft delete
GET    /api/v1/inventory/:id/history  movement log
POST   /api/v1/inventory/:id/adjust   log stock movement

GET    /api/v1/products               product catalog
POST   /api/v1/products               create product
GET    /api/v1/products/barcode/:code lookup by barcode
```

### New / Updated Files (as built — mobile only)
```
shared/constants/inventory.ts             — storage locations, movement reasons, expiry window
shared/validation/schemas.ts (updated)    — inventoryItem + adjustment Zod schemas
shared/constants/sync.ts (updated)        — inventory_movements added to SYNCED_TABLES
mobile/models/inventoryMovements.ts       — movement-log table
mobile/models/inventoryItems.ts (updated) — StorageLocation imported from shared
mobile/lib/sync/tableRegistry.ts (updated)— registers inventory_movements
mobile/controller/InventoryController.ts  — sync-aware CRUD + movement log
mobile/controller/ProductController.ts    — find-or-create product by name
mobile/hooks/useInventory.ts              — React Query reads + create/update/adjust/delete
mobile/lib/inventory/alerts.ts            — low-stock / expiry / out-of-stock rules
mobile/lib/inventory/format.ts            — quantity/date display + input parsing
mobile/app/(tabs)/inventory.tsx           — inventory list (filter bar, FAB)
mobile/app/(tabs)/InventoryDetails/[id].tsx, _layout.tsx — detail + history
mobile/components/inventory/*             — InventoryCard, InventoryFilterBar, AlertBadge,
                                            MovementRow, OptionChips, InventoryFormModal,
                                            InventoryAdjustModal, alertMeta
mobile/drizzle/0001_low_the_santerians.sql — inventory_movements migration
```
Deferred to Phase 8 (backend): `backend/src/routes/inventory.ts`, `products.ts`, `services/InventoryService.ts`.

### Dependencies
- Phase 3 complete (offline schema with sync columns)

### Acceptance Criteria
_Implemented in code; `tsc --noEmit`, `eslint`, and `drizzle-kit generate` clean. On-device QA still pending._
- Adding an item with airplane mode on: item appears in list, `sync_status = 'pending_create'` and a `sync_queue` entry is enqueued
- Setting `min_quantity = 2`, reducing quantity to 1: low-stock badge appears (filter + card)
- Expiration date within 7 days: expiring-soon badge appears
- Adjusting quantity: an `inventory_movements` row is written with the chosen reason and resulting quantity

### Pull Requests
- PR 6: `feat/inventory-management` — all screens, components, hooks, movement log (SQLite only) — GitHub PR #4 ✅
- PR 7: `feat/inventory-api` — backend routes, Postgres schema, service layer (deferred to Phase 8)

---

## Phase 5 — Shopping List Module

**Status:** ⬜ Not started (partial UI exists, not DB-backed)
**Effort:** 6 days (4 mobile + 2 backend)

### Goal
Replace the current hardcoded/stubbed shopping list with a fully functional, offline-capable multi-list system integrated with the inventory layer.

### User Stories
- Create multiple named shopping lists
- Add items by searching the product catalog or entering freeform text
- Tap "Add low-stock items" to populate from inventory alerts in one action
- Check off items while shopping (with haptic feedback)
- Lists persist offline and sync when reconnected

### User Flows
```
Lists Hub (list.tsx)
  ├── FAB → Create New List → name entry → open List Detail
  ├── Tap existing list card → List Detail
  └── "Add Low-Stock Items" → auto-populate from inventory alerts

List Detail
  ├── Add Item (search products or freeform)
  ├── Check / uncheck (haptic feedback)
  ├── Swipe left → delete item
  ├── Long-press → reorder (drag handle)
  └── "Mark all unchecked" / "Clear checked" bulk actions
```

### Inventory Integration
```typescript
// "Restock low-stock items" — adds the deficit quantity for each alert
async function generateListFromAlerts(listId: number): Promise<void>
```

### Cleanup in this Phase
- Delete `mobile/models/schema.ts` — deprecated old schema (`tblitems`, `tbllists`)
- Delete `mobile/app/(tabs)/test_tab.tsx` — test tab in production routing
- Replace all stubs in `mobile/controller/ShoppingListController.ts`

### New / Updated Files
```
mobile/app/(tabs)/list.tsx                — fully DB-backed with React Query
mobile/app/lists/[id].tsx                 — list detail / editor
mobile/components/NoteCard.tsx            — updated to use real DB data
mobile/components/ShoppingList.tsx        — updated: drag-to-reorder, swipe-delete
mobile/controller/ShoppingListController.ts — complete implementation
mobile/hooks/useShoppingLists.ts
backend/src/routes/lists.ts
backend/src/services/ListService.ts
```

### Sharing (V2)
- Backend: `list_shares` table — `list_id`, `user_id`, `permission` (view/edit)
- Real-time: WebSocket broadcast on list changes when shared
- Mobile: `is_shared` flag + shared indicator on the list card

### Dependencies
- Phase 3 (sync schema), Phase 4 (inventory alerts for auto-populate)

### Acceptance Criteria
- Creating a list and killing the app: list is present on relaunch
- Checking an item: `is_checked` written to SQLite immediately (not just local state)
- "Add low-stock items": items appear matching current inventory alerts
- Deleting a list: all child `shopping_list_items` are cascade-deleted

### Pull Requests
- PR 8: `feat/shopping-list-rewrite` — full CRUD, inventory integration, remove stubs + test tab
- PR 9: `feat/shopping-list-api` — backend routes

---

## Phase 6 — Price Comparison Module

**Status:** ⬜ Not started
**Effort:** 6 days (4 mobile + 2 backend)

### Goal
Track product prices at multiple configurable stores and find the cheapest way to complete a shopping list.

### User Stories
- Add a store (Walmart, Target, Costco, or custom name)
- Record a price for a product at a given store
- View a side-by-side price comparison for any product
- See which store has the cheapest basket for the current shopping list
- All price data works offline

### Price Comparison View
```
Product: Whole Milk (1 gallon)
─────────────────────────────────────────
Store          Price       Last Updated
Walmart        $3.48       2 days ago
Target         $3.99       1 week ago
Costco         $2.89 ★     Today
─────────────────────────────────────────
★ Cheapest   Save $1.10 vs most expensive
```

### Basket Optimization
```
"Cheapest Basket" for "Weekly Shop"
─────────────────────────────────────────
Go to Walmart for:
  Bread $2.49, Eggs $3.99, Pasta $1.29
  Subtotal: $7.77

Go to Costco for:
  Milk $2.89, Cheese $8.99
  Subtotal: $11.88

Total: $19.65   vs. $24.12 at one store
Estimated savings: $4.47
─────────────────────────────────────────
```

**Optimization mode:** "minimize cost" (visit multiple stores) or "minimize trips" (best single store). User-configurable.

**Algorithm:** For each item on the list, find the lowest tracked price across all stores. Group by store. Present ranked options.

### New Files
```
mobile/app/prices/index.tsx               — price comparison hub
mobile/app/prices/[productId].tsx         — per-product price comparison
mobile/app/stores/index.tsx               — store management
mobile/components/PriceComparisonCard.tsx
mobile/components/StoreTag.tsx
mobile/hooks/usePrices.ts
mobile/hooks/useShoppingOptimizer.ts
backend/src/routes/stores.ts
backend/src/routes/prices.ts
backend/src/services/PriceService.ts
backend/src/services/OptimizerService.ts
```

### Dependencies
- Phase 3 (store_prices schema), Phase 5 (shopping lists to optimize)

### Pull Requests
- PR 10: `feat/price-comparison` — stores, prices, comparison UI
- PR 11: `feat/shopping-optimizer` — basket optimization algorithm + UI

---

## Phase 7 — Barcode Scanner

**Status:** ⬜ Not started
**Effort:** 4 days (2 mobile + 2 backend)

### Goal
Scan a product barcode anywhere in the app to instantly look up, add, or update a product — with full offline fallback.

### Library
`expo-camera` with the `BarcodeScanner` prop (Expo SDK 53). `expo-barcode-scanner` is deprecated — do not use it.

### Scan Flows
```
Tap "Scan" anywhere in app
  └── Camera opens (full-screen, rear camera)
      └── Barcode detected
          ├── [Found in local SQLite]
          │     └── Show product → "Add to Inventory" or "Add to List"
          ├── [Found via backend API → Open Food Facts]
          │     └── Save to local products table → same as above
          └── [Not found anywhere]
                └── "Unknown product" modal
                      ├── Enter name manually
                      └── Save skeleton product (sync_status = 'pending_create')
```

### Offline Behaviour
- All lookups check local SQLite first — no network required
- If online: fallback to backend → Open Food Facts API (free, no key required)
- If offline + unknown barcode: save a skeleton product record; sync when reconnected
- Camera and barcode detection are native — work offline always

### Open Food Facts Integration
```typescript
// backend/src/services/BarcodeService.ts
async lookupBarcode(barcode: string): Promise<Product | null>
  // 1. Check Postgres products table
  // 2. If not found, call Open Food Facts API
  // 3. If found externally, save to Postgres, return to mobile
  // 4. Mobile saves to SQLite products table
```

### Edge Cases
| Case | Handling |
|---|---|
| Damaged / partial barcode | Scanner timeout after 10s → prompt manual entry |
| Multiple barcodes in frame | Use first detected; debounce 500ms |
| Same barcode scanned twice | Check-then-insert with barcode uniqueness constraint |
| Product has multiple barcodes | Store all barcodes per product (array column or junction table) |

### New Files
```
mobile/app/scan/index.tsx                 — scanner screen
mobile/components/BarcodeScanner.tsx      — reusable camera component
mobile/hooks/useBarcodeLookup.ts          — local-then-remote lookup
backend/src/services/BarcodeService.ts
backend/src/routes/products.ts            — GET /api/v1/products/barcode/:code
```

### Dependencies
- Phase 3 (products table with barcode column), Phase 4 (inventory add flow)

### Pull Requests
- PR 12: `feat/barcode-scanner` — camera screen, local lookup, offline queuing
- PR 13: `feat/barcode-api` — backend lookup + Open Food Facts integration

---

## Phase 8 — Backend Modernization

**Status:** ⬜ Not started (scaffold only)
**Effort:** 6 days

### Goal
Production-ready backend with authentication, JWT sessions, sync endpoint, and background workers.

### Authentication
```
POST /api/v1/auth/register    {email, password} → {access_token, refresh_token}
POST /api/v1/auth/login       {email, password} → {access_token, refresh_token}
POST /api/v1/auth/refresh     {refresh_token}   → {access_token}
POST /api/v1/auth/logout      invalidate refresh token in Redis
```

- Access token: 15-minute expiry (JWT)
- Refresh token: 30-day expiry, stored in Redis
- Mobile stores both in `expo-secure-store` — never AsyncStorage

### API Standards
| Concern | Standard |
|---|---|
| Versioning | `/api/v1/` prefix; breaking changes bump to `/api/v2/` |
| Validation | Zod on all request bodies (shared from `@clay/shared`) |
| Auth | `Authorization: Bearer <token>` on all protected routes |
| Row-level security | Users access only their own data — enforced in service layer |
| Caching | Redis: refresh tokens, barcode lookup (TTL 24h), product catalog (TTL 1h) |
| Logging | Pino structured JSON; never log PII |
| Error format | `{ error: { code, message, details? } }` — never expose stack trace |

### HTTP Status Codes
| Code | Meaning |
|---|---|
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Unauthorized (wrong user) |
| 404 | Not found |
| 409 | Sync conflict (version mismatch) |
| 500 | Internal error |

### Background Workers (BullMQ + Redis)
| Worker | Trigger | Job |
|---|---|---|
| SyncWorker | On demand | Processes sync payloads pushed by mobile clients |
| CleanupWorker | Nightly cron | Purges soft-deleted records older than 90 days |
| AlertWorker (V2) | On inventory write | Generates push notifications for low-stock / expiry |

### PostgreSQL Schema Additions
```
users           (id UUID PK, email UNIQUE, password_hash, created_at, updated_at)
sync_log        (id, user_id, table_name, record_id, operation, client_version,
                 server_version, conflict_resolution, resolved_at)
```
All existing tables (products, inventory_items, etc.) gain a `user_id FK → users`.

### New Files
```
backend/src/middleware/auth.ts            — JWT verification
backend/src/routes/auth.ts
backend/src/services/AuthService.ts
backend/src/db/schema.ts                  — full Postgres schema
backend/src/db/migrate.ts                 — migration runner
backend/src/workers/SyncWorker.ts
backend/src/workers/CleanupWorker.ts
backend/.env.example                      — all required env vars documented
```

### Dependencies
- Phase 2 (Fastify scaffold), Phases 4–7 (all routes to protect)

### Pull Requests
- PR 14: `feat/auth` — register/login/JWT/refresh + SecureStore on mobile
- PR 15: `feat/background-workers` — BullMQ + SyncWorker + CleanupWorker

---

## Phase 9 — Performance Optimization

**Status:** ⬜ Not started
**Effort:** 3 days (distributed across other phases)

### Goal
Identify and eliminate the most impactful bottlenecks in mobile rendering, SQLite queries, and backend throughput.

### Mobile Optimizations
| Bottleneck | Fix |
|---|---|
| FlatList rendering large inventory | `windowSize`, `maxToRenderPerBatch`, `keyExtractor` tuning |
| Heavy Drizzle queries blocking the UI thread | Move to background thread via `expo-sqlite` async API |
| Slow product image first paint | `expo-image` with `contentFit="cover"` + LRU memory cache |
| Barcode camera startup latency | Pre-initialize camera when navigating toward scan screen |
| React Query unnecessary re-renders | Use `select` to extract only required fields from query cache |

### SQLite Indexes
```sql
CREATE INDEX idx_inventory_sync       ON inventory_items(sync_status);
CREATE INDEX idx_list_items_list      ON shopping_list_items(list_id, is_checked);
CREATE INDEX idx_products_barcode     ON products(barcode);
CREATE INDEX idx_prices_product_store ON store_prices(product_id, store_id);
CREATE INDEX idx_sync_queue_status    ON sync_queue(processed_at, retry_count);
```

### Backend Optimizations
| Bottleneck | Fix |
|---|---|
| Full table scans on inventory | Postgres indexes on `user_id`, `deleted_at`, `sync_status` |
| N+1 on shopping list items | Drizzle `with()` for eager loading |
| Barcode API round-trips | Redis cache with 24h TTL |
| Bulk sync payload serialization | Postgres batch inserts; use `COPY` for large sync chunks |

### Priority Matrix
| Optimization | Impact | Effort | Priority |
|---|---|---|---|
| SQLite indexes | High | Low | P0 |
| FlatList tuning | High | Low | P0 |
| Postgres indexes | High | Low | P0 |
| `expo-image` caching | Medium | Low | P1 |
| React Query `select` | Medium | Low | P1 |
| Redis barcode cache | Medium | Low | P1 |
| Background thread queries | High | Medium | P1 |
| Batch sync inserts | High | Medium | P2 |

### Pull Requests
- PR 16: `perf/sqlite-indexes` — all SQLite index migrations
- PR 17: `perf/list-rendering` — FlatList tuning + expo-image

---

## Phase 10 — Release Roadmap

**Status:** ⬜ Reference only — see `docs/Roadmap.md`

### MVP (~25 dev days)
Offline single-user app. No backend required.

| Phase | Feature | Effort |
|---|---|---|
| 1 | Monorepo restructure | 2d ✅ |
| 2 | State management foundation | 3d ✅ |
| 3 | Offline schema + SyncEngine | 5d ✅ |
| 4 | Inventory management | 8d ✅ (mobile; backend → Phase 8) |
| 5 | Shopping list rewrite | 6d |
| 7 | Barcode scanner | 4d |

### V1 (~20 additional dev days)
Adds backend, authentication, cross-device sync, price comparison.

| Phase | Feature | Effort |
|---|---|---|
| 6 | Price comparison + basket optimizer | 6d |
| 8 | Backend: auth, PostgreSQL, Redis, workers | 6d |
| 9 | Performance optimization | 3d |
| — | Integration + QA | 5d |

### V2 (~30 additional dev days)
| Feature |
|---|
| Household / family list sharing |
| Push notifications (low-stock, expiry) |
| Receipt scanning (OCR → auto-update prices) |
| Aggregate spending analytics |
| Multiple household profiles |

### Future
- AI-generated shopping lists from purchase history
- Grocery delivery API integrations (Instacart, Walmart Grocery)
- Voice input for inventory updates
- Apple Watch / WearOS glance for shopping list

---

## Pull Request Map

| PR | Branch | Phase | Description |
|---|---|---|---|
| 1 | `feature/monorepo-restructure` | 1 | File moves, workspace config ✅ |
| 2 | `feat/state-management-foundation` | 2 | Zustand, React Query, Zod wiring ✅ |
| 3 | `feat/backend-scaffold` | 2 | Fastify, Postgres, Drizzle, health routes ✅ |
| 4 | `feat/offline-schema` | 3 | New Drizzle schema + migrations |
| 5 | `feat/sync-engine` | 3 | SyncEngine, useNetworkStatus |
| 6 | `feat/inventory-management` | 4 | Inventory screens, hooks, movement log (offline-only) — GitHub PR #4 ✅ |
| 7 | `feat/inventory-api` | 4 | Backend inventory routes (deferred → Phase 8) |
| 8 | `feat/shopping-list-rewrite` | 5 | Full list CRUD, remove stubs |
| 9 | `feat/shopping-list-api` | 5 | Backend list routes |
| 10 | `feat/price-comparison` | 6 | Stores, prices, comparison UI |
| 11 | `feat/shopping-optimizer` | 6 | Basket optimization |
| 12 | `feat/barcode-scanner` | 7 | Camera screen, local lookup |
| 13 | `feat/barcode-api` | 7 | Backend lookup + Open Food Facts |
| 14 | `feat/auth` | 8 | Register/login/JWT/SecureStore |
| 15 | `feat/background-workers` | 8 | BullMQ + SyncWorker |
| 16 | `perf/sqlite-indexes` | 9 | SQLite index migrations |
| 17 | `perf/list-rendering` | 9 | FlatList tuning + expo-image |
