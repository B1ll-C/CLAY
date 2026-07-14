import type { Unit } from '@clay/shared';
import { boolean, integer, pgTable, real, serial, text } from 'drizzle-orm/pg-core';

import { userColumns, versionColumns } from './_columns.js';
import { products } from './products.js';
import { shoppingLists } from './shoppingLists.js';

export const shoppingListItems = pgTable('shopping_list_items', {
  id: serial('id').primaryKey(),
  ...userColumns,
  listId: integer('list_id')
    .notNull()
    .references(() => shoppingLists.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id),
  name: text('name').notNull(),
  quantity: real('quantity').notNull().default(1),
  unit: text('unit').$type<Unit>(),
  isChecked: boolean('is_checked').notNull().default(false),
  notes: text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...versionColumns,
});

export type ShoppingListItemRow = typeof shoppingListItems.$inferSelect;
export type NewShoppingListItem = typeof shoppingListItems.$inferInsert;
