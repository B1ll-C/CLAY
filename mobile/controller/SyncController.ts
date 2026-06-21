import { db } from "@/models/db";
import {
  syncQueue,
  type SyncQueueEntry,
} from "@/models/syncQueue";
import {
  MAX_SYNC_RETRIES,
  SYNC_QUEUE_MAX_AGE_MS,
  type SyncOperation,
} from "@clay/shared";
import { and, asc, eq, gt, isNull, lt, sql } from "drizzle-orm";

export interface EnqueueInput {
  /** Table the mutation touched, e.g. `"shopping_lists"`. */
  table: string;
  /** Local autoincrement id of the affected row. */
  recordId: number;
  operation: SyncOperation;
  /** Changed fields; omit/null for a DELETE. */
  payload?: Record<string, unknown> | null;
}

/**
 * DB access for the local sync outbox (`sync_queue`). The SyncEngine is the only
 * caller of the drain/retry methods; feature controllers call `enqueue` after
 * every offline mutation (see lib/sync/stamping.ts for the row-side patch).
 */
export const SyncController = {
  /** Append one pending mutation to the outbox. */
  enqueue: async ({ table, recordId, operation, payload }: EnqueueInput): Promise<void> => {
    await db.insert(syncQueue).values({
      tableName: table,
      recordId,
      operation,
      payload: payload != null ? JSON.stringify(payload) : null,
    });
  },

  /**
   * Unprocessed entries that are under the retry ceiling and not yet stale,
   * oldest first — the exact set a push should attempt.
   */
  getPending: async (limit = 200): Promise<SyncQueueEntry[]> => {
    const freshAfter = new Date(Date.now() - SYNC_QUEUE_MAX_AGE_MS);
    return db
      .select()
      .from(syncQueue)
      .where(
        and(
          isNull(syncQueue.processedAt),
          lt(syncQueue.retryCount, MAX_SYNC_RETRIES),
          gt(syncQueue.createdAt, freshAfter),
        ),
      )
      .orderBy(asc(syncQueue.id))
      .limit(limit);
  },

  /** Count of mutations still waiting to be pushed (drives the UI badge). */
  pendingCount: async (): Promise<number> => {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(syncQueue)
      .where(isNull(syncQueue.processedAt));
    return row?.count ?? 0;
  },

  /** Mark an entry done after the server accepted it. */
  markProcessed: async (id: number): Promise<void> => {
    await db
      .update(syncQueue)
      .set({ processedAt: new Date(), lastError: null })
      .where(eq(syncQueue.id, id));
  },

  /** Record a failed attempt; the entry is retried until the ceiling. */
  recordFailure: async (id: number, error: string): Promise<void> => {
    await db
      .update(syncQueue)
      .set({
        retryCount: sql`${syncQueue.retryCount} + 1`,
        lastError: error,
      })
      .where(eq(syncQueue.id, id));
  },
};
