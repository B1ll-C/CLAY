import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Backend (PostgreSQL) schema.
 *
 * This is the Phase 2 scaffold — it wires Drizzle + Postgres end to end with a
 * single placeholder table so migrations can be generated and applied. The full
 * production schema (users, products, inventory_items, sync_log, …) lands in
 * Phase 8 — see docs/Phases.md.
 */
export const appMeta = pgTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
