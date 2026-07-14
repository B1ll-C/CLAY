import { integer, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.js';

/**
 * version/timestamp columns spread into every domain table, mirroring
 * `mobile/models/_syncColumns.ts` on the server side. `serverId`/`syncStatus`
 * are client-only concepts and have no server-side equivalent.
 */
export const versionColumns = {
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

/**
 * `user_id` FK spread into every user-owned table. The `products` catalog is
 * the one synced table that does NOT get this — it's shared/global so two
 * users scanning the same barcode reuse one row (see docs/Phases.md Phase 8).
 */
export const userColumns = {
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
};
