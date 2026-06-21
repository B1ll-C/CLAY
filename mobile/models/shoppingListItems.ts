import type { Unit } from "@clay/shared";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { products } from "./products";
import { shoppingLists } from "./shoppingLists";
import { syncColumns } from "./_syncColumns";

/**
 * A line on a shopping list. Optionally linked to a catalog `product`; `name`
 * is always present so free-text items work without a product record.
 */
export const shoppingListItems = sqliteTable("shopping_list_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listId: integer("list_id")
    .notNull()
    .references(() => shoppingLists.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  name: text("name").notNull(),
  quantity: real("quantity").notNull().default(1),
  unit: text("unit").$type<Unit>(),
  isChecked: integer("is_checked", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  ...syncColumns,
});

export type ShoppingListItemRow = typeof shoppingListItems.$inferSelect;
export type NewShoppingListItem = typeof shoppingListItems.$inferInsert;
