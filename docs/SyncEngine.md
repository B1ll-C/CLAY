# CLAY — Sync Engine

> Status: Planned — implementation in Phase 3

## Overview

The SyncEngine runs in the background and synchronizes local SQLite changes with the backend.

## Trigger Points

- App comes to foreground
- Network connectivity restored (`false → true` transition)
- User manually pulls to refresh
- App launches (deferred 3s to not block startup)

## Push Flow

1. Query `sync_queue` for unprocessed entries
2. For each entry: send operation + payload to `POST /api/v1/sync/push`
3. On success: update `sync_status = 'synced'`, set `server_id`, mark queue entry processed
4. On 409 conflict: apply conflict resolution rule, retry
5. On network error: increment `retry_count`; skip if `retry_count >= 10`

## Pull Flow

1. Read `last_pull_at` from local settings
2. Fetch `GET /api/v1/sync/pull?since={last_pull_at}`
3. Merge server changes into local SQLite (skip if local version is newer)
4. Update `last_pull_at`

## sync_queue Table

```sql
sync_queue (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name    TEXT NOT NULL,
  record_id     INTEGER NOT NULL,
  operation     TEXT NOT NULL,  -- CREATE | UPDATE | DELETE
  payload       TEXT,           -- JSON of changed fields
  retry_count   INTEGER DEFAULT 0,
  last_error    TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at  TIMESTAMP
)
```
