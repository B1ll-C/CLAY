import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { tbllist_title } from "./listTitle";

export const tbllist_item = sqliteTable("tbllist_item", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lt_id: integer("lt_id").references(() => tbllist_title.id, {
    onDelete: "cascade",
  }),
  item: text("item").notNull(), // SQLite doesn’t enforce varchar length
  isChecked: integer("isChecked", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  deletedAt: integer("deletedAt", { mode: "timestamp" }),
});
