import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { syncColumns } from "./_syncColumns";

/** A physical store. Schema only in Phase 3; the price UI lands in Phase 6. */
export const stores = sqliteTable("stores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address"),
  ...syncColumns,
});

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
