import { integer, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.js';

/**
 * Audit trail of every sync push applied server-side (Phase 8). One row per
 * `SyncChange` processed by `SyncService`, whether applied or resolved as a
 * conflict — see `shared/validation/sync.ts` for the wire shapes this mirrors.
 */
export const syncLog = pgTable('sync_log', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tableName: text('table_name').notNull(),
  recordId: integer('record_id').notNull(),
  operation: text('operation').notNull(),
  clientVersion: integer('client_version'),
  serverVersion: integer('server_version'),
  /** Row assigned/touched by this change — lets a retried CREATE be recognized as a replay. */
  serverId: text('server_id'),
  conflictResolution: text('conflict_resolution'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }).notNull().defaultNow(),
});

export type SyncLogEntry = typeof syncLog.$inferSelect;
export type NewSyncLogEntry = typeof syncLog.$inferInsert;
