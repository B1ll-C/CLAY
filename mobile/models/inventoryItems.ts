import type { StorageLocation, Unit } from "@clay/shared";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { products } from "./products";
import { syncColumns } from "./_syncColumns";

/** A quantity of a product on hand, with expiry and low-stock thresholds. */
export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id),
  quantity: real("quantity").notNull().default(0),
  unit: text("unit").$type<Unit>(),
  expirationDate: integer("expiration_date", { mode: "timestamp" }),
  location: text("location").$type<StorageLocation>().notNull().default("pantry"),
  minQuantity: real("min_quantity"),
  costPerUnit: real("cost_per_unit"),
  notes: text("notes"),
  ...syncColumns,
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
