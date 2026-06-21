# CLAY — Offline Strategy

> Status: Planned — implementation in Phase 3

## Principles

1. **Local-first**: all reads/writes go to SQLite first; network is never required
2. **Optimistic UI**: mutations update the UI immediately; sync happens in background
3. **Non-blocking sync**: users are never blocked waiting for the server
4. **Graceful conflicts**: conflicts resolved automatically with user notification for destructive cases

## Sync Columns (all tables)

| Column | Type | Purpose |
|---|---|---|
| `sync_status` | text | `synced` / `pending_create` / `pending_update` / `pending_delete` |
| `server_id` | text | null until first successful push |
| `version` | integer | incremented on every update; used for conflict detection |
| `last_synced_at` | timestamp | last time this record was confirmed synced |

## Conflict Resolution

| Scenario | Rule |
|---|---|
| Same field edited locally and on server | Server wins (last-write-wins per field) |
| Deleted on server, edited locally | Server delete wins; notify user |
| Created locally while offline | Push to server; assign server_id on response |

See SyncEngine.md for implementation details.
