# CLAY — Offline Strategy

> Status: Implemented in Phase 3 (offline-only). Backend transport lands in Phase 8.

## Principles

1. **Local-first**: all reads/writes go to SQLite first; network is never required
2. **Optimistic UI**: mutations update the UI immediately; sync happens in background
3. **Non-blocking sync**: users are never blocked waiting for the server
4. **Graceful conflicts**: conflicts resolved automatically with user notification for destructive cases

## Sync Columns (all synced tables)

Spread into every synced table via the `syncColumns` mixin
(`mobile/models/_syncColumns.ts`):

| Column | Type | Purpose |
|---|---|---|
| `sync_status` | text | `synced` / `pending_create` / `pending_update` / `pending_delete` |
| `server_id` | text | null until first successful push |
| `version` | integer | incremented on every local update; used for conflict detection |
| `last_synced_at` | timestamp | last time this record was confirmed synced |
| `created_at` / `updated_at` | timestamp | unix-seconds row timestamps |
| `deleted_at` | timestamp | soft-delete tombstone; null while live |

The status literals and operations are defined once in `@clay/shared`
(`shared/constants/sync.ts`) so the client and the Phase 8 backend agree.

## Write Path

Every local mutation does two things in lockstep:

1. **Stamp the row** with a sync patch (`mobile/lib/sync/stamping.ts`):
   `syncCreatePatch` / `syncUpdatePatch` / `syncDeletePatch` set `sync_status`,
   bump `version`, and update timestamps. Deletes are soft (set `deleted_at`).
2. **Enqueue an outbox entry** via `SyncController.enqueue(...)` into
   `sync_queue` so the change can be pushed later.

Feature controllers (Phase 4/5) call these; the engine never originates writes.

## Conflict Resolution

Implemented in `mobile/lib/sync/conflict.ts` (`resolveConflict`):

| Scenario | Rule |
|---|---|
| Same field edited locally and on server | Server wins (last-write-wins) |
| Deleted on server, edited locally | Server delete wins; `notifyUser = true` |
| Created locally while offline | Push assigns `server_id` on response (not a conflict) |

See `docs/SyncEngine.md` for the push/pull flow and file map.
