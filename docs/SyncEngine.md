# CLAY — Sync Engine

> Status: Skeleton implemented in Phase 3. Runs offline-only until Phase 8
> injects an HTTP transport.

## Overview

The SyncEngine (`mobile/lib/sync/SyncEngine.ts`) synchronizes local SQLite
changes with the backend. It is transport-agnostic: orchestration lives in the
engine, while HTTP details live behind the `SyncTransport` interface. Phase 3
ships **no transport**, so `sync()` reconciles locally and reports
`offline: true`; Phase 8 calls `syncEngine.setTransport(...)` to enable network
sync.

## File Map

| File | Responsibility |
|---|---|
| `lib/sync/SyncEngine.ts` | push/pull orchestration, queue draining, record merge |
| `lib/sync/SyncTransport.ts` | network boundary interface (impl in Phase 8) |
| `lib/sync/conflict.ts` | pure `resolveConflict` policy |
| `lib/sync/stamping.ts` | row-side sync patches for the write path |
| `lib/sync/syncSettings.ts` | persistent pull cursor (`last_pull_at`) |
| `lib/sync/tableRegistry.ts` | wire-name → Drizzle table map |
| `controller/SyncController.ts` | `sync_queue` DB access (enqueue/drain/retry) |
| `hooks/useNetworkStatus.ts` | connectivity signal |
| `hooks/useSyncStatus.ts` | pending count + last-synced time + `sync()` trigger |

## Public API

```
SyncEngine
  .setTransport(t)       — inject the HTTP transport (Phase 8)
  .sync()                — full push + pull cycle; coalesces re-entrant calls
  .pushChanges()         — drain sync_queue; POST /api/v1/sync/push
  .pullChanges(since)    — GET /api/v1/sync/pull?since= ; merge results
```

## Trigger Points

- App comes to foreground
- Network connectivity restored (`false → true` transition)
- User manually pulls to refresh (`useSyncStatus().sync()`)
- App launches (deferred so it does not block startup)

## Push Flow

1. `SyncController.getPending()` — unprocessed, non-stale entries under the
   retry ceiling, oldest first
2. Enrich each with the row's current `server_id`/`version`, send to
   `POST /api/v1/sync/push`
3. On `applied`: stamp the row `synced`, set `server_id`/`version`, mark the
   queue entry processed
4. On `conflict`: leave the entry queued — the following pull brings the server
   state down and `resolveConflict` reconciles it
5. On network error: `SyncController.recordFailure` increments `retry_count`;
   entries are dropped once `retry_count >= 10`

## Pull Flow

1. Read `last_pull_at` from local settings
2. Fetch `GET /api/v1/sync/pull?since={last_pull_at}`
3. Merge each record into SQLite:
   - unknown locally → insert (skip tombstones)
   - untouched locally and current → skip
   - untouched locally but behind → fast-forward to server
   - locally edited → `resolveConflict` (server wins; notify on server-delete)
4. Persist the server's `serverTime` as the new `last_pull_at`

## sync_queue Table

```sql
sync_queue (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name    TEXT NOT NULL,
  record_id     INTEGER NOT NULL,
  operation     TEXT NOT NULL,  -- CREATE | UPDATE | DELETE
  payload       TEXT,           -- JSON of changed fields
  retry_count   INTEGER NOT NULL DEFAULT 0,
  last_error    TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  processed_at  INTEGER
)
```

## Phase 8 follow-ups

- Implement `SyncTransport` against the Fastify sync routes
- Finalize server↔local field mapping/whitelisting in `applyPulledRecord`
- Swap `useNetworkStatus` to `@react-native-community/netinfo`
- Wire trigger points (AppState foreground + connectivity restore)
