import type { SyncChange, SyncPushResult, SyncRecord } from '@clay/shared';
import { SYNCED_TABLES } from '@clay/shared';
import { and, desc, eq, getTableColumns, gt } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

import { db } from '../db/index.js';
import { syncLog } from '../db/schema/index.js';
import { SYNC_TABLE_REGISTRY, syncTableFor, type SyncTableEntry } from '../db/syncTableRegistry.js';
import { ApiError } from '../lib/errors.js';

type Row = Record<string, unknown>;

function toWireSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/** The sync-identity columns every registry entry shares (see `_columns.ts`). */
function cols(entry: SyncTableEntry) {
  return getTableColumns(entry.table) as unknown as Record<string, PgColumn> & {
    id: PgColumn;
    userId?: PgColumn;
    version: PgColumn;
    deletedAt: PgColumn;
    updatedAt: PgColumn;
  };
}

/** Whitelists + type-coerces an incoming payload's columns for a Drizzle insert/update. */
function coercePayloadForDb(entry: SyncTableEntry, payload: Row): Row {
  const values: Row = {};
  for (const key of entry.columns) {
    if (!(key in payload)) continue;
    const value = payload[key];
    values[key] = entry.dateColumns?.includes(key)
      ? typeof value === 'number'
        ? new Date(value * 1000)
        : null
      : value;
  }
  return values;
}

/** Whitelists + type-coerces a DB row's columns into the wire `data` shape. */
function coerceRowForWire(entry: SyncTableEntry, row: Row): Row {
  const data: Row = {};
  for (const key of entry.columns) {
    const value = row[key];
    if (entry.dateColumns?.includes(key)) {
      data[key] = value instanceof Date ? toWireSeconds(value) : null;
    } else {
      data[key] = value ?? null;
    }
  }
  return data;
}

async function logChange(
  userId: string,
  change: SyncChange,
  serverVersion: number,
  conflictResolution: string | null,
  serverId: string | null = null,
): Promise<void> {
  await db.insert(syncLog).values({
    userId,
    tableName: change.table,
    recordId: change.recordId,
    operation: change.operation,
    clientVersion: change.version,
    serverVersion,
    serverId,
    conflictResolution,
  });
}

/**
 * A CREATE is keyed by the client's local (device-scoped) `recordId`, which
 * is stable across retries of the same push — a dropped ack, a queue entry
 * that never got marked processed, etc. all resend the identical `recordId`.
 * Before inserting, check whether we've already applied a CREATE for this
 * user/table/recordId and, if so, replay that result instead of inserting a
 * second row.
 */
async function findPriorCreate(
  userId: string,
  table: string,
  recordId: number,
): Promise<{ serverId: string } | null> {
  const [log] = await db
    .select({ serverId: syncLog.serverId })
    .from(syncLog)
    .where(
      and(
        eq(syncLog.userId, userId),
        eq(syncLog.tableName, table),
        eq(syncLog.recordId, recordId),
        eq(syncLog.operation, 'CREATE'),
      ),
    )
    .orderBy(desc(syncLog.id))
    .limit(1);
  return log?.serverId ? { serverId: log.serverId } : null;
}

async function applyOne(userId: string, change: SyncChange): Promise<SyncPushResult> {
  const entry = syncTableFor(change.table);
  if (!entry) {
    throw new ApiError(400, 'UNKNOWN_SYNC_TABLE', `Unknown sync table: ${change.table}`);
  }
  const c = cols(entry);
  const ownerFilter = entry.shared ? undefined : eq(c.userId!, userId);

  if (change.operation === 'CREATE') {
    const prior = await findPriorCreate(userId, change.table, change.recordId);
    if (prior) {
      const idFilter = eq(c.id, Number(prior.serverId));
      const where = ownerFilter ? and(idFilter, ownerFilter)! : idFilter;
      const [existing] = await db.select().from(entry.table).where(where);
      if (existing) {
        // Replay: this recordId already has a CREATE on file (e.g. the ack
        // for the first push got dropped and the client retried) — echo the
        // prior result instead of inserting a duplicate row.
        return {
          table: change.table,
          recordId: change.recordId,
          status: 'applied',
          serverId: prior.serverId,
          version: Number((existing as Row).version),
        };
      }
      // The row is gone (hard-deleted) — fall through and create fresh.
    }

    const values = coercePayloadForDb(entry, change.payload ?? {});
    const [row] = await db
      .insert(entry.table)
      .values({ ...(entry.shared ? {} : { userId }), ...values } as never)
      .returning();
    const created = row as Row;
    await logChange(userId, change, 1, null, String(created.id));
    return {
      table: change.table,
      recordId: change.recordId,
      status: 'applied',
      serverId: String(created.id),
      version: 1,
    };
  }

  const serverId = change.serverId;
  if (!serverId) {
    throw new ApiError(400, 'MISSING_SERVER_ID', `${change.operation} requires a serverId`);
  }
  const idFilter = eq(c.id, Number(serverId));
  const where = ownerFilter ? and(idFilter, ownerFilter)! : idFilter;

  const [existing] = await db.select().from(entry.table).where(where);
  if (!existing) {
    // Not found or owned by a different user — identical response either way
    // so a push can never be used to probe another user's data.
    return { table: change.table, recordId: change.recordId, status: 'conflict', serverId, version: 0 };
  }

  const current = existing as Row;
  const currentVersion = Number(current.version);
  if (change.version < currentVersion) {
    await logChange(userId, change, currentVersion, 'stale_version', serverId);
    return { table: change.table, recordId: change.recordId, status: 'conflict', serverId, version: currentVersion };
  }

  const newVersion = currentVersion + 1;
  if (change.operation === 'DELETE') {
    await db
      .update(entry.table)
      .set({ deletedAt: new Date(), version: newVersion, updatedAt: new Date() } as never)
      .where(where);
  } else {
    const values = coercePayloadForDb(entry, change.payload ?? {});
    await db
      .update(entry.table)
      .set({ ...values, version: newVersion, updatedAt: new Date() } as never)
      .where(where);
  }
  await logChange(userId, change, newVersion, null, serverId);
  return { table: change.table, recordId: change.recordId, status: 'applied', serverId, version: newVersion };
}

/**
 * Applies a batch of pushed changes and answers pull requests. Push is applied
 * synchronously, inline in the route handler (not queued to a worker) so the
 * mobile `SyncEngine` gets `applied`/`conflict` results in the same HTTP
 * response — see the Phase 8 plan's architectural decisions.
 */
export const SyncService = {
  async applyPush(userId: string, changes: SyncChange[]): Promise<{ results: SyncPushResult[]; serverTime: number }> {
    const results: SyncPushResult[] = [];
    for (const change of changes) {
      try {
        results.push(await applyOne(userId, change));
      } catch (err) {
        // An individual change's identity/state problem (bad serverId, unknown
        // table, ...) shouldn't block every other change in the batch from
        // landing — surface it as an unresolved conflict so the client
        // retries just that entry instead of the whole push failing.
        if (!(err instanceof ApiError)) throw err;
        results.push({
          table: change.table,
          recordId: change.recordId,
          status: 'conflict',
          serverId: change.serverId ?? null,
          version: change.version,
        });
      }
    }
    return { results, serverTime: toWireSeconds(new Date()) };
  },

  async pull(userId: string, since: number): Promise<{ records: SyncRecord[]; serverTime: number }> {
    const sinceDate = new Date(since * 1000);
    const records: SyncRecord[] = [];
    for (const tableName of SYNCED_TABLES) {
      const entry = SYNC_TABLE_REGISTRY[tableName];
      const c = cols(entry);
      const where = entry.shared ? gt(c.updatedAt, sinceDate) : and(eq(c.userId!, userId), gt(c.updatedAt, sinceDate));
      const rows = await db.select().from(entry.table).where(where);
      for (const raw of rows) {
        const row = raw as Row;
        records.push({
          table: tableName,
          serverId: String(row.id),
          version: Number(row.version),
          deleted: row.deletedAt != null,
          data: coerceRowForWire(entry, row),
          updatedAt: toWireSeconds(row.updatedAt as Date),
        });
      }
    }
    return { records, serverTime: toWireSeconds(new Date()) };
  },
};
