import { InventoryController } from "@/controller/InventoryController";
import { SyncController } from "@/controller/SyncController";
import {
  syncCreatePatch,
  syncDeletePatch,
  syncUpdatePatch,
} from "@/lib/sync/stamping";
import { alertStatuses } from "@/lib/inventory/alerts";
import { db } from "@/models/db";
import {
  shoppingListItems,
  type ShoppingListItemRow,
} from "@/models/shoppingListItems";
import {
  shoppingLists,
  type ShoppingListRow,
} from "@/models/shoppingLists";
import type {
  ShoppingListInput,
  ShoppingListItemInput,
} from "@clay/shared";
import { and, asc, desc, eq, isNull, max, sql } from "drizzle-orm";

/** A list with its item progress, for the lists hub. */
export interface ShoppingListSummary extends ShoppingListRow {
  itemCount: number;
  checkedCount: number;
}

/**
 * Sync-aware DB operations for shopping lists and their items (Phase 5).
 *
 * Mirrors the inventory module: every local write stamps the row for sync (see
 * lib/sync/stamping) and enqueues an outbox entry (see controller/SyncController)
 * so it pushes once the Phase 8 transport lands. Items are soft-deleted, so a
 * deleted list cascades to its children explicitly rather than relying on the
 * SQLite foreign-key cascade (which only fires on a hard delete).
 */
export const ShoppingListController = {
  /** All live lists with item/checked counts, newest first. */
  listSummaries: async (): Promise<ShoppingListSummary[]> => {
    const rows = await db
      .select({
        list: shoppingLists,
        itemCount: sql<number>`count(${shoppingListItems.id})`,
        checkedCount: sql<number>`coalesce(sum(${shoppingListItems.isChecked}), 0)`,
      })
      .from(shoppingLists)
      .leftJoin(
        shoppingListItems,
        and(
          eq(shoppingListItems.listId, shoppingLists.id),
          isNull(shoppingListItems.deletedAt),
        ),
      )
      .where(isNull(shoppingLists.deletedAt))
      .groupBy(shoppingLists.id)
      .orderBy(desc(shoppingLists.createdAt));
    return rows.map(({ list, itemCount, checkedCount }) => ({
      ...list,
      itemCount: Number(itemCount),
      checkedCount: Number(checkedCount),
    }));
  },

  getList: async (id: number): Promise<ShoppingListRow | undefined> => {
    const [row] = await db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.id, id))
      .limit(1);
    return row;
  },

  /** Live items on a list, in display (sort) order. */
  getItems: async (listId: number): Promise<ShoppingListItemRow[]> =>
    db
      .select()
      .from(shoppingListItems)
      .where(
        and(
          eq(shoppingListItems.listId, listId),
          isNull(shoppingListItems.deletedAt),
        ),
      )
      .orderBy(asc(shoppingListItems.sortOrder), asc(shoppingListItems.id)),

  createList: async (input: ShoppingListInput): Promise<number> => {
    const now = new Date();
    const [created] = await db
      .insert(shoppingLists)
      .values({
        title: input.title,
        isShared: input.isShared,
        ...syncCreatePatch(now),
      })
      .returning();
    await SyncController.enqueue({
      table: "shopping_lists",
      recordId: created.id,
      operation: "CREATE",
      payload: { title: created.title, isShared: created.isShared },
    });
    return created.id;
  },

  updateList: async (id: number, input: ShoppingListInput): Promise<void> => {
    const current = await requireList(id);
    const now = new Date();
    await db
      .update(shoppingLists)
      .set({
        title: input.title,
        isShared: input.isShared,
        ...syncUpdatePatch(current, now),
      })
      .where(eq(shoppingLists.id, id));
    await SyncController.enqueue({
      table: "shopping_lists",
      recordId: id,
      operation: "UPDATE",
      payload: { title: input.title, isShared: input.isShared },
    });
  },

  /** Soft-delete a list and all its live items. */
  removeList: async (id: number): Promise<void> => {
    const current = await requireList(id);
    const now = new Date();
    const items = await ShoppingListController.getItems(id);
    for (const item of items) {
      await softDeleteItem(item, now);
    }

    await db
      .update(shoppingLists)
      .set(syncDeletePatch(current, now))
      .where(eq(shoppingLists.id, id));
    await SyncController.enqueue({
      table: "shopping_lists",
      recordId: id,
      operation: "DELETE",
      payload: null,
    });
  },

  /** Append an item to a list (placed after the current last item). */
  addItem: async (
    listId: number,
    input: ShoppingListItemInput,
  ): Promise<number> => {
    const now = new Date();
    const sortOrder = await nextSortOrder(listId);
    const [created] = await db
      .insert(shoppingListItems)
      .values({
        listId,
        productId: input.productId ?? null,
        name: input.name,
        quantity: input.quantity,
        unit: input.unit ?? null,
        notes: input.notes ?? null,
        sortOrder,
        ...syncCreatePatch(now),
      })
      .returning();
    await SyncController.enqueue({
      table: "shopping_list_items",
      recordId: created.id,
      operation: "CREATE",
      payload: {
        listId,
        productId: created.productId,
        name: created.name,
        quantity: created.quantity,
        unit: created.unit,
        notes: created.notes,
        isChecked: created.isChecked,
        sortOrder: created.sortOrder,
      },
    });
    return created.id;
  },

  updateItem: async (
    id: number,
    input: ShoppingListItemInput,
  ): Promise<void> => {
    const current = await requireItem(id);
    const now = new Date();
    await db
      .update(shoppingListItems)
      .set({
        productId: input.productId ?? null,
        name: input.name,
        quantity: input.quantity,
        unit: input.unit ?? null,
        notes: input.notes ?? null,
        ...syncUpdatePatch(current, now),
      })
      .where(eq(shoppingListItems.id, id));
    await SyncController.enqueue({
      table: "shopping_list_items",
      recordId: id,
      operation: "UPDATE",
      payload: {
        productId: input.productId ?? null,
        name: input.name,
        quantity: input.quantity,
        unit: input.unit ?? null,
        notes: input.notes ?? null,
      },
    });
  },

  /** Toggle an item's checked state. */
  setItemChecked: async (id: number, isChecked: boolean): Promise<void> => {
    const current = await requireItem(id);
    if (current.isChecked === isChecked) return;
    const now = new Date();
    await db
      .update(shoppingListItems)
      .set({ isChecked, ...syncUpdatePatch(current, now) })
      .where(eq(shoppingListItems.id, id));
    await SyncController.enqueue({
      table: "shopping_list_items",
      recordId: id,
      operation: "UPDATE",
      payload: { isChecked },
    });
  },

  removeItem: async (id: number): Promise<void> => {
    const current = await requireItem(id);
    await softDeleteItem(current, new Date());
  },

  /** Set every live item on a list to the given checked state. */
  setAllChecked: async (listId: number, isChecked: boolean): Promise<void> => {
    const items = await ShoppingListController.getItems(listId);
    for (const item of items) {
      await ShoppingListController.setItemChecked(item.id, isChecked);
    }
  },

  /** Soft-delete every checked item on a list. */
  clearChecked: async (listId: number): Promise<void> => {
    const now = new Date();
    const items = await ShoppingListController.getItems(listId);
    for (const item of items) {
      if (item.isChecked) await softDeleteItem(item, now);
    }
  },

  /**
   * Populate a list from current inventory low-stock / out-of-stock alerts —
   * the "Add low-stock items" action. For each alerting item it adds the deficit
   * needed to reach the low-stock threshold (at least one), skipping products
   * already present on the list. Returns the number of items added.
   */
  generateFromAlerts: async (listId: number): Promise<number> => {
    const [inventory, existing] = await Promise.all([
      InventoryController.list(),
      ShoppingListController.getItems(listId),
    ]);

    const existingProductIds = new Set(
      existing.map((item) => item.productId).filter((pid): pid is number => pid != null),
    );
    const existingNames = new Set(
      existing.map((item) => item.name.trim().toLowerCase()),
    );

    let added = 0;
    for (const item of inventory) {
      const statuses = alertStatuses(item);
      const needsRestock =
        statuses.includes("out_of_stock") || statuses.includes("low_stock");
      if (!needsRestock) continue;

      const name = item.product?.name?.trim();
      if (!name) continue;
      if (item.productId != null && existingProductIds.has(item.productId)) continue;
      if (existingNames.has(name.toLowerCase())) continue;

      const target = item.minQuantity ?? 1;
      const deficit = Math.max(1, Math.ceil(target - item.quantity));

      await ShoppingListController.addItem(listId, {
        name,
        quantity: deficit,
        unit: item.unit ?? undefined,
        productId: item.productId ?? undefined,
      });

      if (item.productId != null) existingProductIds.add(item.productId);
      existingNames.add(name.toLowerCase());
      added += 1;
    }
    return added;
  },
};

/** Load a list's sync identity, or throw if it's gone. */
async function requireList(id: number): Promise<ShoppingListRow> {
  const [row] = await db
    .select()
    .from(shoppingLists)
    .where(eq(shoppingLists.id, id))
    .limit(1);
  if (!row) throw new Error(`Shopping list ${id} not found`);
  return row;
}

/** Load an item's sync identity, or throw if it's gone. */
async function requireItem(id: number): Promise<ShoppingListItemRow> {
  const [row] = await db
    .select()
    .from(shoppingListItems)
    .where(eq(shoppingListItems.id, id))
    .limit(1);
  if (!row) throw new Error(`Shopping list item ${id} not found`);
  return row;
}

/** Next sort-order slot for a list (one past the current maximum). */
async function nextSortOrder(listId: number): Promise<number> {
  const [row] = await db
    .select({ value: max(shoppingListItems.sortOrder) })
    .from(shoppingListItems)
    .where(
      and(
        eq(shoppingListItems.listId, listId),
        isNull(shoppingListItems.deletedAt),
      ),
    );
  return (row?.value ?? -1) + 1;
}

/** Soft-delete one item and enqueue its DELETE. */
async function softDeleteItem(
  item: ShoppingListItemRow,
  now: Date,
): Promise<void> {
  await db
    .update(shoppingListItems)
    .set(syncDeletePatch(item, now))
    .where(eq(shoppingListItems.id, item.id));
  await SyncController.enqueue({
    table: "shopping_list_items",
    recordId: item.id,
    operation: "DELETE",
    payload: null,
  });
}
