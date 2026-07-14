import type { StorageLocation, Unit } from '@clay/shared';
import { integer, pgTable, real, serial, text, timestamp } from 'drizzle-orm/pg-core';

import { userColumns, versionColumns } from './_columns.js';
import { products } from './products.js';

export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  ...userColumns,
  productId: integer('product_id').references(() => products.id),
  quantity: real('quantity').notNull().default(0),
  unit: text('unit').$type<Unit>(),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  location: text('location').$type<StorageLocation>().notNull().default('pantry'),
  minQuantity: real('min_quantity'),
  costPerUnit: real('cost_per_unit'),
  notes: text('notes'),
  ...versionColumns,
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
