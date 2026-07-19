import type { SyncStatus } from "@clay/shared";
import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

/**
 * Sync metadata spread into every synced table (Phase 3 offline-first
 * foundation). Drizzle clones these builders per table, so the same object can
 * be reused across schemas.
 *
 * | column           | purpose                                              |
 * |------------------|------------------------------------------------------|
 * | `server_id`      | remote id; null until the first successful push      |
 * | `sync_status`    | local sync state — see `SyncStatus`                  |
 * | `version`        | bumped on every local edit; drives conflict detection|
 * | `last_synced_at` | last time the row was confirmed in sync              |
 * | `created_at`     | row creation (unix seconds)                          |
 * | `updated_at`     | last local mutation (unix seconds)                   |
 * | `deleted_at`     | soft-delete tombstone; null while live               |
 *
 * Timestamps use `unixepoch()` so they land as integer seconds, matching
 * Drizzle's `{ mode: "timestamp" }` decoding.
 */
export const syncColumns = {
  serverId: text("server_id"),
  syncStatus: text("sync_status")
    .$type<SyncStatus>()
    .notNull()
    .default("pending_create"),
  version: integer("version").notNull().default(1),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
};
