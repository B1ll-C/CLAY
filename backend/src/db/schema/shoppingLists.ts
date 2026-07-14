import { boolean, pgTable, serial, text } from 'drizzle-orm/pg-core';

import { userColumns, versionColumns } from './_columns.js';

export const shoppingLists = pgTable('shopping_lists', {
  id: serial('id').primaryKey(),
  ...userColumns,
  title: text('title').notNull(),
  isShared: boolean('is_shared').notNull().default(false),
  ...versionColumns,
});

export type ShoppingListRow = typeof shoppingLists.$inferSelect;
export type NewShoppingList = typeof shoppingLists.$inferInsert;
