import type { ProductCategory, Unit } from "@clay/shared";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { syncColumns } from "./_syncColumns";

/** Product catalog. Referenced by inventory items, list items, and prices. */
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category").$type<ProductCategory>(),
  barcode: text("barcode"),
  sku: text("sku"),
  unit: text("unit").$type<Unit>(),
  notes: text("notes"),
  imageUrl: text("image_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...syncColumns,
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
