import { inventoryItems } from "@/models/inventoryItems";
import { products } from "@/models/products";
import { shoppingListItems } from "@/models/shoppingListItems";
import { shoppingLists } from "@/models/shoppingLists";
import { storePrices } from "@/models/storePrices";
import { stores } from "@/models/stores";
import type { SyncedTable } from "@clay/shared";

/**
 * Maps a wire table name to its Drizzle table so the engine can apply server
 * acknowledgements and pulled records generically. All entries share the
 * `syncColumns` shape (see models/_syncColumns), which the engine relies on.
 */
export const SYNCED_TABLE_REGISTRY = {
  products,
  stores,
  shopping_lists: shoppingLists,
  inventory_items: inventoryItems,
  shopping_list_items: shoppingListItems,
  store_prices: storePrices,
} satisfies Record<SyncedTable, unknown>;

export type SyncedTableEntry =
  (typeof SYNCED_TABLE_REGISTRY)[keyof typeof SYNCED_TABLE_REGISTRY];

/** Returns the Drizzle table for a wire name, or undefined if not synced. */
export function tableFor(name: string): SyncedTableEntry | undefined {
  return (SYNCED_TABLE_REGISTRY as Record<string, SyncedTableEntry>)[name];
}
