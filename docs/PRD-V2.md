# CLAY V2 — Product Requirements Document

**Date:** 2026-07-19
**Status:** 📋 Planned — no V2 phase started
**Estimated effort:** ~28 dev days
**Baseline:** V1 complete on `develop` (Phases 1–8, 11; Supabase backend merged via GitHub PR #14). Phase 9 (performance optimization) was deferred out of V1 into V2 and deliberately runs **last** — see priority rationale below.

---

## Overview

V1 shipped a single-user, offline-first grocery/inventory app with cross-device sync. V2 turns CLAY into a **household product**: families share shopping lists, get notified about stock and each other's activity, see where their money goes, and (eventually) feed prices in automatically from receipts.

## Goals

- Let a family run one shared shopping list instead of texting screenshots
- Surface low-stock/expiry alerts even when the app is closed (push)
- Answer "how much did we spend on groceries this month, and where?"
- Reduce manual price entry via receipt OCR
- Preserve the offline-first guarantee for everything except explicitly-online features (receipt OCR)

## Priority Order

| Priority | Phase | Feature | Effort | Rationale |
|---|---|---|---|---|
| P0 | 12 | Household / family list sharing | 8d | Core V2 value proposition; Phase 13's household pushes build on it |
| P1 | 13 | Push notifications (local + remote) | 5d | Local half needs no backend; remote half depends on Phase 12 |
| P2 | 14 | Spending analytics | 5d | Works from manually captured prices immediately; enriched later by receipts |
| P3 | 15 | Receipt scanning (OCR → prices) | 7d | Highest technical risk (external OCR, messy parsing); feeds Phase 14 but isn't required by it |
| P4 | 9 | Performance optimization (deferred from V1) | 3d | Pure optimization, no user-facing feature; running it last means the index/tuning pass also covers all new V2 tables and screens |

**Dependencies:** Phase 13's remote-push half requires Phase 12 (household events are what get pushed). Phase 15 enriches Phase 14's data but Phase 14 ships first and works without it. Phase 9 intentionally has no dependents.

## Non-Functional Requirements (all phases)

- Offline-first is preserved: analytics and local notifications work fully offline; receipt OCR is the only online-only feature and the UI must say so
- Every new synced table includes the standard sync columns (`sync_status`, `server_id`, `version`) and flows through the existing SyncEngine — no feature-specific sync paths
- Testing policy from `CLAUDE.md` applies per phase: unit for new pure logic, integration via `buildApp().inject()` for new routes, Maestro flow for new user-facing screens
- CI (`ci.yml`) must stay green on every PR; release-branch automation is unchanged

---

## Phase 12 — Household / Family List Sharing (P0)

### Goal
Multiple users share shopping lists inside a "household". Members see each other's changes after sync, with attribution.

### User Stories
- As a parent, I create a household and invite my family with a short code so we all see one grocery list
- As an invitee, I join a household by entering the invite code
- As a member, I see items other members added/checked after sync, with who did it
- As the owner, I can remove a member or delete the household
- As a member, I can leave a household; my personal (non-shared) data is untouched

### Functional Requirements
- **Backend schema:** `households` (id, name, `owner_id` → users), `household_members` (household_id, user_id, role `owner|member`, joined_at), invite codes (8-char, single-use, 48h expiry — Redis with TTL, matching existing Redis usage)
- **Routes** (all under `/api/v1`, `requireAuth`): `POST /households`, `GET /households/mine`, `POST /households/:id/invites`, `POST /households/join`, `DELETE /households/:id/members/:userId`, `POST /households/:id/leave`, `DELETE /households/:id`
- **Sharing model:** `shopping_lists` gains nullable `household_id` (the existing `is_shared` boolean becomes derived/deprecated). A list with a `household_id` is readable/writable by every member. **Inventory stays personal in V2.**
- **SyncService:** pull returns rows owned by the user OR rows whose `household_id` is in the user's households; push validates membership before accepting a write. Conflict resolution stays last-write-wins version bumping — no new conflict semantics
- **Attribution:** `shopping_list_items` gains nullable `created_by` / `checked_by` (server user ids); `users` gains `display_name` so attribution isn't an email address
- **Mobile:** local `households` table mirror + migration; Household screen (create / join via code / member list / leave); share-to-household action on a list; "added by Sam · checked by Alex" attribution on shared list items; shared-list badge in the list index

### Out of Scope
- Realtime/live updates (sync-interval-based is fine for V2; Supabase Realtime is a Future candidate now that the backend is Supabase-hosted)
- Shared inventory, granular per-list permissions, multiple concurrent households per list

### Pull Requests
- PR 21: `feat/households-backend` — schema, invite/membership routes, SyncService household scoping
- PR 22: `feat/households-mobile` — local schema mirror, household screens, shared-list UX + attribution

---

## Phase 13 — Push Notifications (P1)

### Goal
Alerts reach users when the app is closed: inventory alerts locally (offline-capable), household activity via server push.

### User Stories
- As a user, I get a notification when an item runs low or is about to expire, even with the app closed and no connectivity
- As a household member, I get a push when someone adds items to or completes a shared list
- As a user, I can toggle each notification category and set quiet hours

### Functional Requirements
- **13a — Local notifications (no backend):** `expo-notifications`; schedule from the existing alert rules in `mobile/lib/inventory/alerts.ts` (low-stock / expiry / out-of-stock) on a daily background evaluation; notification settings screen (per-category toggles, quiet hours) persisted in Zustand + SQLite
- **13b — Remote push (depends on Phase 12):** `device_push_tokens` table (user_id, Expo push token, platform, last_seen) + register/unregister route; `NotificationWorker` (BullMQ, same pattern as `CleanupWorker`) sends household-activity pushes via the Expo Push API; dedupe/batch so a 20-item add is one push, not twenty
- Tapping a notification deep-links to the relevant screen (inventory item / shared list)

### Out of Scope
- Marketing/engagement pushes, per-product notification rules, email digests

### Pull Requests
- PR 23: `feat/local-notifications` — expo-notifications, alert scheduling, settings screen
- PR 24: `feat/push-notifications` — token registry, NotificationWorker, household-activity pushes

---

## Phase 14 — Spending Analytics (P2)

### Goal
Show where grocery money goes — computed locally from data the app already captures, fully offline.

### User Stories
- As a user, I see my monthly grocery spend and its trend over time
- As a user, I see spend broken down by category and by store
- As a user, when I restock inventory or check off a list item, I can record what I paid so analytics stay accurate

### Functional Requirements
- **Purchase capture:** `inventory_movements` gains nullable `unit_price` and `store_id` (append-only log already exists — no new table); restock and check-off flows get an optional price/store input, pre-filled from `store_prices` when known
- **Analytics screen:** monthly spend trend, category breakdown, spend by store, average basket size — all SQL aggregates over local SQLite; time-range selector (month / 3mo / year)
- Charting library chosen at implementation time (`victory-native` vs `react-native-gifted-charts`)
- No new backend routes — the new columns ride the existing sync push/pull

### Out of Scope
- Budgets/budget alerts, forecasting, CSV export, household-aggregated analytics (per-user only in V2)

### Pull Requests
- PR 25: `feat/spending-analytics` — movement cost columns + capture UX + analytics screen

---

## Phase 15 — Receipt Scanning OCR (P3)

### Goal
Photograph a receipt, extract line items, and apply them as price updates (and optionally purchases/restocks) after user review. Online-only, and labeled as such.

### User Stories
- As a user, I photograph a receipt and get a parsed list of items with prices
- As a user, I review/edit the parsed items and match them to my products before anything is written
- As a user, confirming the receipt updates store prices and (optionally) logs purchases and restocks inventory

### Functional Requirements
- **Capture:** receipt photo via the existing `expo-camera` setup (separate flow from barcode scan)
- **Backend:** `POST /api/v1/receipts/scan` — accepts the image, proxies to the OCR provider (key stays server-side), returns structured line items (name, qty, unit price, line total, store guess, date). Provider (Google Cloud Vision vs on-device ML Kit vs other) is a decision gate at phase start
- **Parsing:** heuristic line-item extraction + fuzzy match against the user's product catalog; unmatched lines can create skeleton products (same pattern as offline barcode scan)
- **Review screen:** nothing is written until the user confirms; per-line accept/edit/discard
- **Apply:** updates `store_prices`, optionally writes purchase movements (feeding Phase 14) and inventory restocks

### Out of Scope
- Fully automatic no-review application, receipt image archival, multi-page receipts, warranty/returns tracking

### Pull Requests
- PR 26: `feat/receipt-capture` — camera flow + backend OCR route
- PR 27: `feat/receipt-review` — parse/match/review/apply flow

---

## Phase 9 (rescheduled) — Performance Optimization (P4, runs last)

Deferred from V1; full detail in `docs/Phases.md` Phase 9. Running it after all V2 features means the index and list-tuning pass covers the V2 tables (`households`, `device_push_tokens`, movement cost columns) and screens (analytics, household) too.

- SQLite indexes for high-frequency queries (+ Postgres indexes on `user_id`, `deleted_at`, `sync_status`)
- FlatList tuning (`windowSize`, `maxToRenderPerBatch`, `keyExtractor`) on inventory/list/catalog + new V2 screens
- `expo-image` for product images (already a dependency, unused)
- React Query `select` in heavy hooks
- ~~Redis barcode cache~~ — **already shipped** in Phase 8 (`BarcodeService`)

### Pull Requests
- PR 16: `perf/sqlite-indexes` — SQLite + Postgres index migrations
- PR 17: `perf/list-rendering` — FlatList tuning + expo-image + React Query `select`

---

## V2 Feature Checklist

Tick items as they land on `develop`. (Pre-done items are marked.)

### Phase 12 — Household sharing
- [ ] Backend `households` + `household_members` schema + migrations
- [ ] Invite codes (Redis, single-use, 48h TTL)
- [ ] Household routes (create / mine / invite / join / remove member / leave / delete)
- [ ] SyncService household scoping (pull visibility + push membership validation)
- [ ] `shopping_lists.household_id` (mobile + backend) — supersedes `is_shared`
- [ ] Item attribution columns (`created_by`, `checked_by`) + `users.display_name`
- [ ] Mobile household screens (create / join / members / leave)
- [ ] Shared-list UX (share action, badge, attribution display)
- [ ] Tests: route integration, sync-scoping unit, Maestro household flow

### Phase 13 — Push notifications
- [ ] expo-notifications setup + permission flow
- [ ] Local scheduling from `lib/inventory/alerts.ts` rules
- [ ] Notification settings screen (category toggles, quiet hours)
- [ ] `device_push_tokens` table + register/unregister route
- [ ] `NotificationWorker` (BullMQ) + Expo Push API send
- [ ] Household-activity pushes (batched/deduped)
- [ ] Notification deep links
- [ ] Tests: worker unit, token-route integration

### Phase 14 — Spending analytics
- [ ] `inventory_movements.unit_price` + `store_id` columns (mobile + backend)
- [ ] Price capture on restock + list check-off (pre-filled from `store_prices`)
- [ ] Analytics screen: monthly trend, category + store breakdown, time ranges
- [ ] Charting library decision + integration
- [ ] Tests: aggregate-query unit, Maestro analytics flow

### Phase 15 — Receipt scanning
- [ ] OCR provider decision gate
- [ ] Receipt camera capture flow
- [ ] `POST /api/v1/receipts/scan` backend route (provider proxied)
- [ ] Line-item parsing + fuzzy product matching
- [ ] Review/edit/confirm screen
- [ ] Apply: store prices + optional purchases/restock
- [ ] Tests: parser unit, route integration, Maestro receipt flow

### Phase 9 — Performance (last)
- [ ] SQLite index migrations (incl. V2 tables)
- [ ] Postgres indexes on `user_id`, `deleted_at`, `sync_status`
- [ ] FlatList tuning on all list screens
- [ ] `expo-image` for product images
- [ ] React Query `select` in heavy hooks
- [x] Redis cache for barcode lookups — shipped in Phase 8 (`BarcodeService`)
