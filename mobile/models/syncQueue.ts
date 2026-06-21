import type { SyncOperation } from "@clay/shared";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Local-only outbox. Every offline mutation appends one row here; the
 * SyncEngine drains it on the next push. Not a synced table itself — it carries
 * no sync columns.
 */
export const syncQueue = sqliteTable("sync_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableName: text("table_name").notNull(),
  recordId: integer("record_id").notNull(),
  operation: text("operation").$type<SyncOperation>().notNull(),
  /** JSON of the changed fields; null for a DELETE. */
  payload: text("payload"),
  retryCount: integer("retry_count").notNull().default(0),
  lastError: text("last_error"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  processedAt: integer("processed_at", { mode: "timestamp" }),
});

export type SyncQueueEntry = typeof syncQueue.$inferSelect;
export type NewSyncQueueEntry = typeof syncQueue.$inferInsert;
