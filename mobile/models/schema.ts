import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tblitems = sqliteTable("tblitems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  isChecked: integer("isChecked", { mode: "boolean" }).default(false).notNull(),
  list_id: integer("list_id")
    .notNull()
    .references(() => tbllists.id),
});

export const tbllists = sqliteTable("tbllists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

export type ListItems = typeof tblitems.$inferSelect;
