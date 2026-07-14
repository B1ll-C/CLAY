import { pgTable, serial, text } from 'drizzle-orm/pg-core';

import { userColumns, versionColumns } from './_columns.js';

export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  ...userColumns,
  name: text('name').notNull(),
  address: text('address'),
  ...versionColumns,
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
