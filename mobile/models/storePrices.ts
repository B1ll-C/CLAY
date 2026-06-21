import type { Unit } from "@clay/shared";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { products } from "./products";
import { stores } from "./stores";
import { syncColumns } from "./_syncColumns";

/** A product's price at a store, with optional promotion. Used in Phase 6. */
export const storePrices = sqliteTable("store_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  storeId: integer("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  price: real("price").notNull(),
  unit: text("unit").$type<Unit>(),
  promotionPrice: real("promotion_price"),
  promotionExpiresAt: integer("promotion_expires_at", { mode: "timestamp" }),
  lastVerifiedAt: integer("last_verified_at", { mode: "timestamp" }),
  ...syncColumns,
});

export type StorePrice = typeof storePrices.$inferSelect;
export type NewStorePrice = typeof storePrices.$inferInsert;
