import type { MovementReason } from "@clay/shared";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { inventoryItems } from "./inventoryItems";
import { syncColumns } from "./_syncColumns";

/**
 * Append-only audit trail of inventory quantity changes (Phase 4). Every stock
 * adjustment writes one row so on-hand totals stay explainable: `delta` is the
 * signed change, `resultingQuantity` snapshots the item's quantity afterwards,
 * and `reason` classifies it (see `MovementReason`).
 */
export const inventoryMovements = sqliteTable("inventory_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inventoryItemId: integer("inventory_item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  delta: real("delta").notNull(),
  resultingQuantity: real("resulting_quantity").notNull(),
  reason: text("reason").$type<MovementReason>().notNull().default("adjust"),
  notes: text("notes"),
  ...syncColumns,
});

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type NewInventoryMovement = typeof inventoryMovements.$inferInsert;
