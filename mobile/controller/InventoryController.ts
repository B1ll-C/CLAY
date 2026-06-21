import { ProductController } from "@/controller/ProductController";
import { SyncController } from "@/controller/SyncController";
import {
  syncCreatePatch,
  syncDeletePatch,
  syncUpdatePatch,
} from "@/lib/sync/stamping";
import { db } from "@/models/db";
import { inventoryItems, type InventoryItem } from "@/models/inventoryItems";
import {
  inventoryMovements,
  type InventoryMovement,
} from "@/models/inventoryMovements";
import { products, type Product } from "@/models/products";
import type {
  InventoryAdjustmentInput,
  InventoryItemInput,
  MovementReason,
} from "@clay/shared";
import { and, desc, eq, isNull } from "drizzle-orm";

/** An inventory row joined with its catalog product (for list/detail display). */
export interface InventoryItemView extends InventoryItem {
  product: Product | null;
}

/** Clamp a quantity at zero — stock can't go negative. */
function clampQuantity(n: number): number {
  return n < 0 ? 0 : n;
}

/**
 * Sync-aware DB operations for inventory items and their movement log (Phase 4).
 *
 * Each item names a catalog product; the create/update paths resolve the typed
 * name through `ProductController.findOrCreateByName`. Every quantity change —
 * the opening balance, edits via the form, and explicit adjustments — appends an
 * `inventory_movements` row so on-hand totals stay auditable. All writes stamp
 * the row for sync and enqueue an outbox entry, matching the Phase 3 contract.
 */
export const InventoryController = {
  /** All live inventory items with their product, newest first. */
  list: async (): Promise<InventoryItemView[]> => {
    const rows = await db
      .select({ item: inventoryItems, product: products })
      .from(inventoryItems)
      .leftJoin(products, eq(inventoryItems.productId, products.id))
      .where(isNull(inventoryItems.deletedAt))
      .orderBy(desc(inventoryItems.createdAt));
    return rows.map(({ item, product }) => ({ ...item, product }));
  },

  getById: async (id: number): Promise<InventoryItemView | undefined> => {
    const [row] = await db
      .select({ item: inventoryItems, product: products })
      .from(inventoryItems)
      .leftJoin(products, eq(inventoryItems.productId, products.id))
      .where(eq(inventoryItems.id, id))
      .limit(1);
    return row ? { ...row.item, product: row.product } : undefined;
  },

  /** Movement-log entries for an item, newest first. */
  getMovements: async (itemId: number): Promise<InventoryMovement[]> =>
    db
      .select()
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.inventoryItemId, itemId),
          isNull(inventoryMovements.deletedAt),
        ),
      )
      .orderBy(desc(inventoryMovements.createdAt), desc(inventoryMovements.id)),

  /** Create an item, recording its opening balance as an `initial` movement. */
  create: async (input: InventoryItemInput): Promise<number> => {
    const now = new Date();
    const product = await ProductController.findOrCreateByName(
      input.productName,
      { brand: input.brand ?? null, category: input.category ?? null },
    );

    const quantity = clampQuantity(input.quantity);
    const [created] = await db
      .insert(inventoryItems)
      .values({
        productId: product.id,
        quantity,
        unit: input.unit ?? null,
        location: input.location,
        minQuantity: input.minQuantity ?? null,
        costPerUnit: input.costPerUnit ?? null,
        expirationDate: input.expirationDate ?? null,
        notes: input.notes ?? null,
        ...syncCreatePatch(now),
      })
      .returning();

    await SyncController.enqueue({
      table: "inventory_items",
      recordId: created.id,
      operation: "CREATE",
      payload: {
        productId: created.productId,
        quantity: created.quantity,
        unit: created.unit,
        location: created.location,
        minQuantity: created.minQuantity,
        costPerUnit: created.costPerUnit,
        expirationDate: created.expirationDate,
        notes: created.notes,
      },
    });

    if (quantity > 0) {
      await recordMovement(created.id, quantity, quantity, "initial", null, now);
    }
    return created.id;
  },

  /**
   * Edit an item's product and stock attributes. A quantity change made through
   * the form is logged as an `adjust` movement so the audit trail stays whole.
   */
  update: async (id: number, input: InventoryItemInput): Promise<void> => {
    const current = await requireItem(id);
    const now = new Date();
    const product = await ProductController.findOrCreateByName(
      input.productName,
      { brand: input.brand ?? null, category: input.category ?? null },
    );

    const quantity = clampQuantity(input.quantity);
    await db
      .update(inventoryItems)
      .set({
        productId: product.id,
        quantity,
        unit: input.unit ?? null,
        location: input.location,
        minQuantity: input.minQuantity ?? null,
        costPerUnit: input.costPerUnit ?? null,
        expirationDate: input.expirationDate ?? null,
        notes: input.notes ?? null,
        ...syncUpdatePatch(current, now),
      })
      .where(eq(inventoryItems.id, id));

    await SyncController.enqueue({
      table: "inventory_items",
      recordId: id,
      operation: "UPDATE",
      payload: {
        productId: product.id,
        quantity,
        unit: input.unit ?? null,
        location: input.location,
        minQuantity: input.minQuantity ?? null,
        costPerUnit: input.costPerUnit ?? null,
        expirationDate: input.expirationDate ?? null,
        notes: input.notes ?? null,
      },
    });

    const delta = quantity - current.quantity;
    if (delta !== 0) {
      await recordMovement(id, delta, quantity, "adjust", null, now);
    }
  },

  /**
   * Apply a signed quantity change and log it. Returns the new on-hand quantity
   * (clamped at zero). A no-op delta after clamping records nothing.
   */
  adjustQuantity: async (
    id: number,
    input: InventoryAdjustmentInput,
  ): Promise<number> => {
    const current = await requireItem(id);
    const now = new Date();
    const newQuantity = clampQuantity(current.quantity + input.delta);
    const delta = newQuantity - current.quantity;
    if (delta === 0) return current.quantity;

    await db
      .update(inventoryItems)
      .set({ quantity: newQuantity, ...syncUpdatePatch(current, now) })
      .where(eq(inventoryItems.id, id));

    await SyncController.enqueue({
      table: "inventory_items",
      recordId: id,
      operation: "UPDATE",
      payload: { quantity: newQuantity },
    });

    await recordMovement(
      id,
      delta,
      newQuantity,
      input.reason,
      input.notes ?? null,
      now,
    );
    return newQuantity;
  },

  /** Soft-delete an item (its movements cascade on the server in Phase 8). */
  remove: async (id: number): Promise<void> => {
    const current = await requireItem(id);
    const now = new Date();
    await db
      .update(inventoryItems)
      .set(syncDeletePatch(current, now))
      .where(eq(inventoryItems.id, id));
    await SyncController.enqueue({
      table: "inventory_items",
      recordId: id,
      operation: "DELETE",
      payload: null,
    });
  },
};

/** Load an item's sync identity + quantity, or throw if it's gone. */
async function requireItem(id: number): Promise<InventoryItem> {
  const [row] = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, id))
    .limit(1);
  if (!row) throw new Error(`Inventory item ${id} not found`);
  return row;
}

/** Insert one movement-log row and enqueue it for sync. */
async function recordMovement(
  inventoryItemId: number,
  delta: number,
  resultingQuantity: number,
  reason: MovementReason,
  notes: string | null,
  now: Date,
): Promise<void> {
  const [movement] = await db
    .insert(inventoryMovements)
    .values({
      inventoryItemId,
      delta,
      resultingQuantity,
      reason,
      notes,
      ...syncCreatePatch(now),
    })
    .returning();
  await SyncController.enqueue({
    table: "inventory_movements",
    recordId: movement.id,
    operation: "CREATE",
    payload: { inventoryItemId, delta, resultingQuantity, reason, notes },
  });
}
