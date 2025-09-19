import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tbllist_title = sqliteTable("tbllist_title", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  list_title: text("task_title"), // SQLite ignores varchar length
  createdAt: integer("createdAt", { mode: "timestamp" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  deletedAt: integer("deletedAt", { mode: "timestamp" }),
});
