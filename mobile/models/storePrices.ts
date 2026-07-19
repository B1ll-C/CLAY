import type { Unit } from "@clay/shared";
import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { products } from "./products";
import { stores } from "./stores";
import { syncColumns } from "./_syncColumns";

/**
 * A product's price at a store, with optional promotion (Phase 6). The
 * partial unique index scopes to live rows only — a plain unique index would
 * permanently block re-adding a price after a soft delete.
 */
export const storePrices = sqliteTable(
  "store_prices",
  {
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
  },
  (table) => [
    uniqueIndex("idx_store_prices_product_store")
      .on(table.productId, table.storeId)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export type StorePrice = typeof storePrices.$inferSelect;
export type NewStorePrice = typeof storePrices.$inferInsert;
