import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { syncColumns } from "./_syncColumns";

/** A named shopping list. Items live in `shopping_list_items`. */
export const shoppingLists = sqliteTable("shopping_lists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  isShared: integer("is_shared", { mode: "boolean" }).notNull().default(false),
  ...syncColumns,
});

export type ShoppingListRow = typeof shoppingLists.$inferSelect;
export type NewShoppingList = typeof shoppingLists.$inferInsert;
