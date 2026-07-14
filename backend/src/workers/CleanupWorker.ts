import { Worker } from 'bullmq';
import { and, getTableName, isNotNull, lt } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

import { db } from '../db/index.js';
import {
  inventoryItems,
  inventoryMovements,
  products,
  shoppingListItems,
  shoppingLists,
  storePrices,
  stores,
} from '../db/schema/index.js';
import { CLEANUP_QUEUE_NAME, queueConnection } from '../lib/queue.js';

const RETENTION_DAYS = 90;

async function purgeSoftDeleted<T extends PgTable & { id: AnyPgColumn; deletedAt: AnyPgColumn }>(
  table: T,
  cutoff: Date,
): Promise<number> {
  try {
    const rows = await db
      .delete(table)
      .where(and(isNotNull(table.deletedAt), lt(table.deletedAt, cutoff)))
      .returning({ id: table.id });
    return rows.length;
  } catch (err) {
    // A row can still be referenced by a live (not-yet-deleted) FK in another
    // table — e.g. a product purge candidate with a live inventory_items row
    // pointing at it. Log and move on rather than aborting the whole nightly
    // purge over one blocked table.
    console.error(`[cleanup] failed to purge ${getTableName(table)}:`, err instanceof Error ? err.message : err);
    return 0;
  }
}

/**
 * Deletes rows whose `deleted_at` is older than the retention window, across
 * every soft-deletable table. Ordered children-first (movements/prices/items
 * before their parent lists/stores/products) to avoid FK conflicts between
 * tables purged in the same run. Exported so it can be invoked directly
 * (manual enqueue, tests) without going through a BullMQ job.
 */
export async function purgeOldSoftDeletes(retentionDays = RETENTION_DAYS): Promise<Record<string, number>> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  return {
    inventory_movements: await purgeSoftDeleted(inventoryMovements, cutoff),
    store_prices: await purgeSoftDeleted(storePrices, cutoff),
    shopping_list_items: await purgeSoftDeleted(shoppingListItems, cutoff),
    inventory_items: await purgeSoftDeleted(inventoryItems, cutoff),
    shopping_lists: await purgeSoftDeleted(shoppingLists, cutoff),
    stores: await purgeSoftDeleted(stores, cutoff),
    products: await purgeSoftDeleted(products, cutoff),
  };
}

/** Starts the BullMQ worker that processes jobs off the `cleanup` queue. */
export function startCleanupWorker(): Worker {
  const worker = new Worker(
    CLEANUP_QUEUE_NAME,
    async () => {
      const counts = await purgeOldSoftDeletes();
      return counts;
    },
    { connection: queueConnection },
  );

  worker.on('error', (err) => {
    console.error('[worker:cleanup]', err.message);
  });

  return worker;
}
