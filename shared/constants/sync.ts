// Cross-stack sync contract — shared by the mobile SyncEngine (Phase 3) and the
// backend sync routes (Phase 8). Keeping these literals in one place guarantees
// the client and server agree on status values, operation names, and endpoints.

/**
 * Local sync state of a record. Every synced table carries a `sync_status`.
 *
 * - `synced`         — confirmed in agreement with the server
 * - `pending_create` — created locally, never pushed
 * - `pending_update` — exists on the server but has unpushed local edits
 * - `pending_delete` — soft-deleted locally, deletion not yet pushed
 */
export const SYNC_STATUSES = [
  'synced',
  'pending_create',
  'pending_update',
  'pending_delete',
] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

/** The three operations the sync queue can carry to the server. */
export const SYNC_OPERATIONS = ['CREATE', 'UPDATE', 'DELETE'] as const;
export type SyncOperation = (typeof SYNC_OPERATIONS)[number];

/**
 * Tables that participate in sync, in dependency order (parents before
 * children) so a push drains foreign-key dependencies first. `sync_queue`
 * itself is local-only and never appears here.
 */
export const SYNCED_TABLES = [
  'products',
  'stores',
  'shopping_lists',
  'inventory_items',
  'inventory_movements',
  'shopping_list_items',
  'store_prices',
] as const;
export type SyncedTable = (typeof SYNCED_TABLES)[number];

/** Backend sync endpoints (wired in Phase 8). */
export const SYNC_PUSH_PATH = '/api/v1/sync/push';
export const SYNC_PULL_PATH = '/api/v1/sync/pull';

/** A queue entry is dropped after this many failed push attempts. */
export const MAX_SYNC_RETRIES = 10;

/** Queue entries older than this (ms) are considered stale and skipped. */
export const SYNC_QUEUE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
