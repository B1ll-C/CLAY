import { SyncController } from "@/controller/SyncController";
import {
  syncCreatePatch,
  syncDeletePatch,
  syncUpdatePatch,
} from "@/lib/sync/stamping";
import { db } from "@/models/db";
import { storePrices } from "@/models/storePrices";
import { stores, type Store } from "@/models/stores";
import type { StoreInput } from "@clay/shared";
import { and, asc, eq, isNull } from "drizzle-orm";

/**
 * Sync-aware DB operations for physical stores (Phase 6). Mirrors
 * `ProductController`; `PriceController` references stores by id once a
 * price is recorded against one.
 */
export const StoreController = {
  /** All live stores, alphabetical. */
  getAll: async (): Promise<Store[]> =>
    db
      .select()
      .from(stores)
      .where(isNull(stores.deletedAt))
      .orderBy(asc(stores.name)),

  getById: async (id: number): Promise<Store | undefined> => {
    const [row] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, id))
      .limit(1);
    return row;
  },

  /**
   * Return the live store matching `name` (case-insensitive), creating one if
   * none exists. Used when a price is recorded for a store typed by name.
   */
  findOrCreateByName: async (
    name: string,
    extra?: { address?: string | null },
  ): Promise<Store> => {
    const trimmed = name.trim();
    const [existing] = await db
      .select()
      .from(stores)
      .where(
        and(
          isNull(stores.deletedAt),
          eq(stores.name, trimmed),
        ),
      )
      .limit(1);
    if (existing) return existing;
    return createStore({ name: trimmed, address: extra?.address ?? undefined });
  },

  create: async (input: StoreInput): Promise<number> => {
    const created = await createStore(input);
    return created.id;
  },

  update: async (id: number, input: StoreInput): Promise<void> => {
    const current = await requireStore(id);
    const now = new Date();
    await db
      .update(stores)
      .set({
        name: input.name,
        address: input.address ?? null,
        ...syncUpdatePatch(current, now),
      })
      .where(eq(stores.id, id));
    await SyncController.enqueue({
      table: "stores",
      recordId: id,
      operation: "UPDATE",
      payload: { name: input.name, address: input.address ?? null },
    });
  },

  /** Soft-delete a store and all its live prices. */
  remove: async (id: number): Promise<void> => {
    const current = await requireStore(id);
    const now = new Date();

    const livePrices = await db
      .select()
      .from(storePrices)
      .where(
        and(eq(storePrices.storeId, id), isNull(storePrices.deletedAt)),
      );
    for (const price of livePrices) {
      await db
        .update(storePrices)
        .set(syncDeletePatch(price, now))
        .where(eq(storePrices.id, price.id));
      await SyncController.enqueue({
        table: "store_prices",
        recordId: price.id,
        operation: "DELETE",
        payload: null,
      });
    }

    await db
      .update(stores)
      .set(syncDeletePatch(current, now))
      .where(eq(stores.id, id));
    await SyncController.enqueue({
      table: "stores",
      recordId: id,
      operation: "DELETE",
      payload: null,
    });
  },
};

async function createStore(input: {
  name: string;
  address?: string | null;
}): Promise<Store> {
  const [created] = await db
    .insert(stores)
    .values({
      name: input.name.trim(),
      address: input.address ?? null,
      ...syncCreatePatch(),
    })
    .returning();
  await SyncController.enqueue({
    table: "stores",
    recordId: created.id,
    operation: "CREATE",
    payload: { name: created.name, address: created.address },
  });
  return created;
}

/** Load a store's sync identity, or throw if it's gone. */
async function requireStore(id: number): Promise<Store> {
  const [row] = await db
    .select()
    .from(stores)
    .where(eq(stores.id, id))
    .limit(1);
  if (!row) throw new Error(`Store ${id} not found`);
  return row;
}
