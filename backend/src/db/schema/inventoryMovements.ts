import type { MovementReason } from '@clay/shared';
import { integer, pgTable, real, serial, text } from 'drizzle-orm/pg-core';

import { userColumns, versionColumns } from './_columns.js';
import { inventoryItems } from './inventoryItems.js';

export const inventoryMovements = pgTable('inventory_movements', {
  id: serial('id').primaryKey(),
  ...userColumns,
  inventoryItemId: integer('inventory_item_id')
    .notNull()
    .references(() => inventoryItems.id, { onDelete: 'cascade' }),
  delta: real('delta').notNull(),
  resultingQuantity: real('resulting_quantity').notNull(),
  reason: text('reason').$type<MovementReason>().notNull().default('adjust'),
  notes: text('notes'),
  ...versionColumns,
});

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type NewInventoryMovement = typeof inventoryMovements.$inferInsert;
