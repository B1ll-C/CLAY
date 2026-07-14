// Per-table wire-payload schemas for the sync protocol (Phase 8). Distinct from
// the form-level `*InputSchema`s in `./schemas` — those model a UI form (e.g.
// inventory input uses `productName` for find-or-create); these model the
// actual persisted column shape sent in `SyncChange.payload` / `SyncRecord.data`.
// All fields are optional since CREATE/UPDATE pushes only ever send the subset
// of columns that changed. Dates are unix-seconds numbers, not JS `Date` —
// `updatedAt` on the envelope already uses that convention, so payload dates
// (`expirationDate`, `promotionExpiresAt`, `lastVerifiedAt`) match it.
import { z } from 'zod';

import { PRODUCT_CATEGORIES } from '../constants/categories';
import { MOVEMENT_REASONS, STORAGE_LOCATIONS } from '../constants/inventory';
import type { SyncedTable } from '../constants/sync';
import { unitSchema } from './schemas';

const unixSeconds = z.number().int();

export const productSyncPayloadSchema = z.object({
  name: z.string().optional(),
  brand: z.string().nullable().optional(),
  category: z.enum(PRODUCT_CATEGORIES).nullable().optional(),
  barcode: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  unit: unitSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type ProductSyncPayload = z.infer<typeof productSyncPayloadSchema>;

export const storeSyncPayloadSchema = z.object({
  name: z.string().optional(),
  address: z.string().nullable().optional(),
});
export type StoreSyncPayload = z.infer<typeof storeSyncPayloadSchema>;

export const shoppingListSyncPayloadSchema = z.object({
  title: z.string().optional(),
  isShared: z.boolean().optional(),
});
export type ShoppingListSyncPayload = z.infer<typeof shoppingListSyncPayloadSchema>;

export const shoppingListItemSyncPayloadSchema = z.object({
  listId: z.number().int().positive().optional(),
  productId: z.number().int().positive().nullable().optional(),
  name: z.string().optional(),
  quantity: z.number().optional(),
  unit: unitSchema.nullable().optional(),
  isChecked: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});
export type ShoppingListItemSyncPayload = z.infer<typeof shoppingListItemSyncPayloadSchema>;

export const inventoryItemSyncPayloadSchema = z.object({
  productId: z.number().int().positive().optional(),
  quantity: z.number().optional(),
  unit: unitSchema.nullable().optional(),
  expirationDate: unixSeconds.nullable().optional(),
  location: z.enum(STORAGE_LOCATIONS).optional(),
  minQuantity: z.number().nullable().optional(),
  costPerUnit: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type InventoryItemSyncPayload = z.infer<typeof inventoryItemSyncPayloadSchema>;

export const inventoryMovementSyncPayloadSchema = z.object({
  inventoryItemId: z.number().int().positive().optional(),
  delta: z.number().optional(),
  resultingQuantity: z.number().optional(),
  reason: z.enum(MOVEMENT_REASONS).optional(),
  notes: z.string().nullable().optional(),
});
export type InventoryMovementSyncPayload = z.infer<typeof inventoryMovementSyncPayloadSchema>;

export const storePriceSyncPayloadSchema = z.object({
  productId: z.number().int().positive().optional(),
  storeId: z.number().int().positive().optional(),
  price: z.number().optional(),
  unit: unitSchema.nullable().optional(),
  promotionPrice: z.number().nullable().optional(),
  promotionExpiresAt: unixSeconds.nullable().optional(),
  lastVerifiedAt: unixSeconds.nullable().optional(),
});
export type StorePriceSyncPayload = z.infer<typeof storePriceSyncPayloadSchema>;

/** Looked up by wire table name to validate a push's `payload` (or a pull's `data`). */
export const SYNC_PAYLOAD_SCHEMAS: Record<SyncedTable, z.ZodTypeAny> = {
  products: productSyncPayloadSchema,
  stores: storeSyncPayloadSchema,
  shopping_lists: shoppingListSyncPayloadSchema,
  inventory_items: inventoryItemSyncPayloadSchema,
  inventory_movements: inventoryMovementSyncPayloadSchema,
  shopping_list_items: shoppingListItemSyncPayloadSchema,
  store_prices: storePriceSyncPayloadSchema,
};
