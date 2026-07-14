import type { SyncedTable } from '@clay/shared';
import type { PgTable } from 'drizzle-orm/pg-core';

import {
  inventoryItems,
  inventoryMovements,
  products,
  shoppingListItems,
  shoppingLists,
  storePrices,
  stores,
} from './schema/index.js';

/**
 * Wire table name → Drizzle table + column whitelist, mirroring
 * `mobile/lib/sync/tableRegistry.ts` on the client side. `shared: true` means
 * no `userId` ownership filter applies (only `products`, per the Phase 8
 * decision that the catalog is global). `dateColumns` lists the whitelisted
 * columns that cross the wire as unix-seconds numbers and need conversion
 * to/from a Postgres `timestamp` (JS `Date`) — see `shared/validation/syncPayloads.ts`.
 */
export interface SyncTableEntry {
  table: PgTable;
  shared: boolean;
  columns: readonly string[];
  dateColumns?: readonly string[];
}

export const SYNC_TABLE_REGISTRY: Record<SyncedTable, SyncTableEntry> = {
  products: {
    table: products,
    shared: true,
    columns: ['name', 'brand', 'category', 'barcode', 'sku', 'unit', 'notes', 'imageUrl', 'isActive'],
  },
  stores: {
    table: stores,
    shared: false,
    columns: ['name', 'address'],
  },
  shopping_lists: {
    table: shoppingLists,
    shared: false,
    columns: ['title', 'isShared'],
  },
  inventory_items: {
    table: inventoryItems,
    shared: false,
    columns: ['productId', 'quantity', 'unit', 'expirationDate', 'location', 'minQuantity', 'costPerUnit', 'notes'],
    dateColumns: ['expirationDate'],
  },
  inventory_movements: {
    table: inventoryMovements,
    shared: false,
    columns: ['inventoryItemId', 'delta', 'resultingQuantity', 'reason', 'notes'],
  },
  shopping_list_items: {
    table: shoppingListItems,
    shared: false,
    columns: ['listId', 'productId', 'name', 'quantity', 'unit', 'isChecked', 'notes', 'sortOrder'],
  },
  store_prices: {
    table: storePrices,
    shared: false,
    columns: ['productId', 'storeId', 'price', 'unit', 'promotionPrice', 'promotionExpiresAt', 'lastVerifiedAt'],
    dateColumns: ['promotionExpiresAt', 'lastVerifiedAt'],
  },
};

/** Returns the registry entry for a wire table name, or undefined if not synced. */
export function syncTableFor(name: string): SyncTableEntry | undefined {
  return (SYNC_TABLE_REGISTRY as Record<string, SyncTableEntry>)[name];
}
