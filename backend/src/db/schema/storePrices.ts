import type { Unit } from '@clay/shared';
import { sql } from 'drizzle-orm';
import { integer, pgTable, real, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { userColumns, versionColumns } from './_columns.js';
import { products } from './products.js';
import { stores } from './stores.js';

/**
 * A user's tracked price for a (shared) product at a (user-owned) store. The
 * partial unique index is scoped by `user_id` too — a price a user tracks is
 * theirs even though the product row itself is shared/global — and to live
 * rows only, so a soft-deleted price can be re-added.
 */
export const storePrices = pgTable(
  'store_prices',
  {
    id: serial('id').primaryKey(),
    ...userColumns,
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    storeId: integer('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    price: real('price').notNull(),
    unit: text('unit').$type<Unit>(),
    promotionPrice: real('promotion_price'),
    promotionExpiresAt: timestamp('promotion_expires_at', { withTimezone: true }),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    ...versionColumns,
  },
  (table) => [
    uniqueIndex('idx_store_prices_user_product_store')
      .on(table.userId, table.productId, table.storeId)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export type StorePrice = typeof storePrices.$inferSelect;
export type NewStorePrice = typeof storePrices.$inferInsert;
