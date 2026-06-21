# Technical Checklist — All Phases

Track cross-cutting technical requirements across the full build.

## Architecture
- [x] Monorepo with npm workspaces configured (`mobile`, `backend`, `shared`)
- [ ] `@clay/shared` package installed and resolving in both `mobile` and `backend`
- [ ] Zod schemas in `shared/validation/schemas.ts` (Phase 2)
- [x] TypeScript strict mode on all three packages

## Mobile
- [ ] All SQLite tables include sync columns: `sync_status`, `server_id`, `version` (Phase 3)
- [x] Drizzle migrations run automatically in `mobile/app/_layout.tsx`
- [ ] TanStack Query v5 installed, `QueryClientProvider` wrapping app (Phase 2)
- [ ] Zustand installed and store created for UI-only state (Phase 2)
- [ ] `expo-secure-store` used for JWT tokens — never AsyncStorage (Phase 8)
- [ ] `expo-camera` configured in `mobile/app.json` with permission description (Phase 7)
- [ ] All screens handle: loading state, empty state, error state (Phase 4+)
- [ ] `mobile/app/(tabs)/test_tab.tsx` removed (Phase 5)
- [ ] `mobile/models/schema.ts` (deprecated old schema) removed (Phase 5)
- [ ] `mobile/controller/ShoppingListController.ts` stubs replaced with real implementations (Phase 5)

## Backend
- [ ] Fastify server with TypeScript (Phase 8)
- [ ] All routes versioned under `/api/v1/` (Phase 8)
- [ ] Zod validation on all request bodies (Phase 8)
- [ ] JWT middleware on all protected routes (Phase 8)
- [ ] PostgreSQL connected via Drizzle ORM with migrations (Phase 8)
- [ ] Redis connected for token store and caching (Phase 8)
- [ ] `GET /health` returns `{ status: "ok", version, uptime }` (Phase 2 scaffold done)
- [ ] Structured JSON logging with Pino (Phase 8)
- [ ] No secrets in source code — `.env.example` documents all required vars (Phase 8)

## Sync
- [ ] `sync_queue` table populated on every local write (Phase 3)
- [ ] `SyncEngine.pushChanges()` processes queue on network restore (Phase 3)
- [ ] `SyncEngine.pullChanges()` fetches server deltas since last sync (Phase 3)
- [ ] Conflict resolution tested with simulated offline edits (Phase 3)
- [ ] Sync status visible to user (last synced timestamp) (Phase 3)

## Performance
- [ ] SQLite indexes added for all high-frequency queries (Phase 9)
- [ ] FlatList tuned: `windowSize`, `maxToRenderPerBatch`, `keyExtractor` (Phase 9)
- [ ] `expo-image` used for all product images (Phase 9)
- [ ] Postgres indexes on `user_id`, `deleted_at`, `sync_status` (Phase 9)
- [ ] Redis cache for barcode lookups (TTL 24h) (Phase 9)
