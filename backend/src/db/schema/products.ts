import type { ProductCategory, Unit } from '@clay/shared';
import { boolean, pgTable, serial, text } from 'drizzle-orm/pg-core';

import { versionColumns } from './_columns.js';

/**
 * Shared/global product catalog — no `user_id`. Two users scanning the same
 * barcode reuse one row and one Open Food Facts lookup (Phase 8 decision;
 * every other domain table below is user-owned).
 */
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand'),
  category: text('category').$type<ProductCategory>(),
  barcode: text('barcode').unique(),
  sku: text('sku'),
  unit: text('unit').$type<Unit>(),
  notes: text('notes'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').notNull().default(true),
  ...versionColumns,
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
