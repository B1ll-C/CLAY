import { db } from "@/models/db";
import { SyncController } from "@/controller/SyncController";
import { SYNC_FK_FIELDS } from "@clay/shared";
import type { SyncChange, SyncedTable, SyncRecord, SyncStatus } from "@clay/shared";
import { eq, getTableColumns } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";

import { resolveConflict } from "./conflict";
import { SyncTransport } from "./SyncTransport";
import { getLastPullAt, setLastPullAt } from "./syncSettings";
import { SyncedTableEntry, tableFor } from "./tableRegistry";

/** Outcome of one push/pull cycle, surfaced to the UI and logs. */
export interface SyncResult {
  ok: boolean;
  /** True when no transport is configured yet (Phase 3 offline-only mode). */
  offline: boolean;
  pushed: number;
  pulled: number;
  conflicts: number;
  /** Records the user should be notified about (destructive resolutions). */
  notifications: number;
  error?: string;
}

const EMPTY_OFFLINE: SyncResult = {
  ok: true,
  offline: true,
  pushed: 0,
  pulled: 0,
  conflicts: 0,
  notifications: 0,
};

/** The sync-metadata columns every synced table shares (see _syncColumns). */
function syncCols(table: SyncedTableEntry) {
  return getTableColumns(table) as unknown as {
    id: SQLiteColumn;
    serverId: SQLiteColumn;
    version: SQLiteColumn;
    syncStatus: SQLiteColumn;
  };
}

/**
 * Background synchronizer for local SQLite ↔ backend.
 *
 * Phase 3 ships the engine with no transport: `sync()` queues and reconciles
 * locally and reports `offline: true` instead of reaching the network. Phase 8
 * calls `setTransport()` with an HTTP implementation to light up real sync.
 *
 * Trigger points (wired by callers): app foreground, connectivity restored,
 * manual pull-to-refresh, and a deferred run on launch.
 */
export class SyncEngine {
  private transport: SyncTransport | null;
  private running = false;

  constructor(transport: SyncTransport | null = null) {
    this.transport = transport;
  }

  /** Inject the HTTP transport (Phase 8) to enable network sync. */
  setTransport(transport: SyncTransport | null): void {
    this.transport = transport;
  }

  /** Full push-then-pull cycle. Re-entrant calls are coalesced. */
  async sync(): Promise<SyncResult> {
    if (this.running) {
      return { ...EMPTY_OFFLINE, offline: !this.transport };
    }
    if (!this.transport) return EMPTY_OFFLINE;

    this.running = true;
    try {
      const push = await this.pushChanges();
      const pull = await this.pullChanges(await getLastPullAt());
      return {
        ok: push.ok && pull.ok,
        offline: false,
        pushed: push.pushed,
        pulled: pull.pulled,
        conflicts: push.conflicts + pull.conflicts,
        notifications: pull.notifications,
        error: push.error ?? pull.error,
      };
    } catch (err) {
      return {
        ...EMPTY_OFFLINE,
        ok: false,
        offline: false,
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      this.running = false;
    }
  }

  /** Drain the outbox to `POST /sync/push` and apply the server's acks. */
  async pushChanges(): Promise<SyncResult> {
    if (!this.transport) return EMPTY_OFFLINE;

    const pending = await SyncController.getPending();
    if (pending.length === 0) {
      return { ...EMPTY_OFFLINE, offline: false };
    }

    // Build the wire payload, enriching each entry with the row's current
    // server_id/version (the queue stores neither). `pushedEntries[i]` and
    // `response.results[i]` line up positionally — SyncService.applyPush
    // processes `changes` in order and pushes one result per change, so we
    // zip by index rather than re-deriving identity from (table, recordId):
    // two queued entries for the same row (e.g. a CREATE then an UPDATE
    // before the first sync ran) share that key, and a lookup keyed on it
    // would silently drop one entry's ack, leaving it stuck pending and
    // replayed as a fresh CREATE on every later sync. `pushedEntries` (not
    // `pending`) is what actually lines up with `changes`/`results`, since
    // some pending entries are resolved locally below and never sent.
    const changes: SyncChange[] = [];
    const pushedEntries: typeof pending = [];
    for (const entry of pending) {
      const meta = await this.loadRowMeta(entry.tableName, entry.recordId);

      // An UPDATE/DELETE for a row with no serverId means its CREATE never
      // reached the server (dropped queue entry, offline the whole time,
      // etc.) — there is nothing there to update or delete remotely.
      // Resolve locally rather than pushing a change the server can only
      // reject, which would otherwise block every other change in the batch.
      if (entry.operation !== "CREATE" && !meta?.serverId) {
        await SyncController.markProcessed(entry.id);
        continue;
      }

      let payload = entry.payload
        ? (JSON.parse(entry.payload) as Record<string, unknown>)
        : null;
      if (payload) {
        const resolved = await this.resolveOutgoingForeignKeys(
          entry.tableName,
          payload,
        );
        // A referenced row (e.g. the item's list) hasn't synced yet — leave
        // this entry queued rather than push a payload the server can't
        // resolve to a real row. It's retried once the parent gets its
        // serverId, on this or a later sync() cycle.
        if (!resolved.ready) continue;
        payload = resolved.payload;
      }

      pushedEntries.push(entry);
      changes.push({
        table: entry.tableName,
        operation: entry.operation,
        recordId: entry.recordId,
        serverId: meta?.serverId ?? null,
        version: meta?.version ?? 0,
        payload,
        updatedAt: Math.floor((entry.createdAt?.getTime() ?? Date.now()) / 1000),
      });
    }

    if (changes.length === 0) {
      return { ...EMPTY_OFFLINE, offline: false };
    }

    let pushed = 0;
    let conflicts = 0;
    try {
      const response = await this.transport.push({ changes });
      for (let i = 0; i < response.results.length; i++) {
        const result = response.results[i];
        const queueId = pushedEntries[i]?.id;
        if (queueId == null) continue;

        if (result.status === "applied") {
          await this.markRowSynced(
            result.table,
            result.recordId,
            result.serverId,
            result.version,
          );
          await SyncController.markProcessed(queueId);
          pushed += 1;
        } else {
          // Conflict — leave queued; the following pull brings the server
          // state down and resolveConflict reconciles it.
          conflicts += 1;
          await SyncController.recordFailure(
            queueId,
            `conflict at server version ${result.version}`,
          );
        }
      }
      return { ...EMPTY_OFFLINE, offline: false, pushed, conflicts };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      for (const entry of pushedEntries) {
        await SyncController.recordFailure(entry.id, message);
      }
      return { ...EMPTY_OFFLINE, ok: false, offline: false, error: message };
    }
  }

  /** Fetch changes since `since` from `GET /sync/pull` and merge them in. */
  async pullChanges(since: number | null): Promise<SyncResult> {
    if (!this.transport) return EMPTY_OFFLINE;

    try {
      const response = await this.transport.pull(since);
      let pulled = 0;
      let conflicts = 0;
      let notifications = 0;
      for (const record of response.records) {
        const applied = await this.applyPulledRecord(record);
        if (applied.skipped) continue;
        pulled += 1;
        if (applied.conflict) conflicts += 1;
        if (applied.notified) notifications += 1;
      }
      await setLastPullAt(response.serverTime);
      return { ...EMPTY_OFFLINE, offline: false, pulled, conflicts, notifications };
    } catch (err) {
      return {
        ...EMPTY_OFFLINE,
        ok: false,
        offline: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /** Read a row's sync identity so a queued change can be addressed remotely. */
  private async loadRowMeta(
    tableName: string,
    recordId: number,
  ): Promise<{ serverId: string | null; version: number } | null> {
    const table = tableFor(tableName);
    if (!table) return null;
    const cols = syncCols(table);
    const rows = await db
      .select()
      .from(table as SQLiteTable)
      .where(eq(cols.id, recordId))
      .limit(1);
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      serverId: (row.serverId as string | null) ?? null,
      version: Number(row.version ?? 0),
    };
  }

  /**
   * Translate a payload's foreign-key fields from this device's local ids to
   * the referenced rows' serverIds before it crosses the wire. `ready` is
   * false when a referenced row hasn't synced yet (no serverId to send).
   */
  private async resolveOutgoingForeignKeys(
    tableName: string,
    payload: Record<string, unknown>,
  ): Promise<{ payload: Record<string, unknown>; ready: boolean }> {
    const fkFields = SYNC_FK_FIELDS[tableName as SyncedTable];
    if (!fkFields) return { payload, ready: true };

    const resolved = { ...payload };
    for (const [field, refTable] of Object.entries(fkFields)) {
      const localId = payload[field];
      if (localId == null) continue; // nullable FK (e.g. no linked product)
      const meta = await this.loadRowMeta(refTable, Number(localId));
      if (!meta?.serverId) return { payload, ready: false };
      resolved[field] = Number(meta.serverId);
    }
    return { payload: resolved, ready: true };
  }

  /**
   * Translate a pulled record's foreign-key fields from the server's ids
   * back to this device's local row ids before it's written to SQLite (whose
   * FK columns point at local ids, same as the server's point at its own).
   * Returns `null` when a referenced row hasn't been pulled to this device
   * yet, so the caller can skip the record rather than write a dangling FK.
   */
  private async resolveIncomingForeignKeys(
    tableName: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    const fkFields = SYNC_FK_FIELDS[tableName as SyncedTable];
    if (!fkFields) return data;

    const resolved = { ...data };
    for (const [field, refTable] of Object.entries(fkFields)) {
      const serverIdValue = data[field];
      if (serverIdValue == null) continue;
      const refTableDef = tableFor(refTable);
      if (!refTableDef) return null;
      const refCols = syncCols(refTableDef);
      const [row] = await db
        .select()
        .from(refTableDef as SQLiteTable)
        .where(eq(refCols.serverId, String(serverIdValue)))
        .limit(1);
      if (!row) return null;
      resolved[field] = (row as Record<string, unknown>).id;
    }
    return resolved;
  }

  /** Stamp a row as synced once the server has acknowledged it. */
  private async markRowSynced(
    tableName: string,
    recordId: number,
    serverId: string | null,
    version: number,
  ): Promise<void> {
    const table = tableFor(tableName);
    if (!table) return;
    const cols = syncCols(table);
    await db
      .update(table as SQLiteTable)
      .set({
        serverId,
        version,
        syncStatus: "synced",
        lastSyncedAt: new Date(),
      } as Record<string, unknown>)
      .where(eq(cols.id, recordId));
  }

  /**
   * Merge one pulled record into local SQLite.
   *
   * Field mapping assumes the server sends column-keyed data; whitelisting and
   * snake/camel mapping are finalized in Phase 8 alongside the real transport.
   */
  private async applyPulledRecord(
    record: SyncRecord,
  ): Promise<{ skipped: boolean; conflict: boolean; notified: boolean }> {
    const table = tableFor(record.table);
    if (!table) return { skipped: true, conflict: false, notified: false };
    const cols = syncCols(table);

    // Translate FK fields (e.g. an item's listId) from the server's ids to
    // this device's local ids before touching SQLite. `null` means a
    // referenced row hasn't been pulled here yet — defer rather than write
    // a dangling reference; it's retried once the parent shows up.
    const data = await this.resolveIncomingForeignKeys(record.table, record.data);
    if (!data) return { skipped: true, conflict: false, notified: false };

    const rows = await db
      .select()
      .from(table as SQLiteTable)
      .where(eq(cols.serverId, record.serverId))
      .limit(1);
    const local = rows[0] as Record<string, unknown> | undefined;

    // First time we've seen this record.
    if (!local) {
      if (record.deleted) return { skipped: true, conflict: false, notified: false };
      await db.insert(table as SQLiteTable).values({
        ...data,
        serverId: record.serverId,
        version: record.version,
        syncStatus: "synced" satisfies SyncStatus,
        lastSyncedAt: new Date(),
      } as Record<string, unknown>);
      return { skipped: false, conflict: false, notified: false };
    }

    const localId = local.id as number;
    const localVersion = Number(local.version ?? 0);
    const localStatus = String(local.syncStatus ?? "synced") as SyncStatus;
    const hasLocalEdits = localStatus !== "synced";

    // Untouched locally and already current → nothing to do.
    if (!hasLocalEdits && localVersion >= record.version) {
      return { skipped: true, conflict: false, notified: false };
    }

    // Untouched locally but behind → fast-forward to the server's copy.
    if (!hasLocalEdits) {
      await db
        .update(table as SQLiteTable)
        .set({
          ...data,
          version: record.version,
          syncStatus: "synced",
          lastSyncedAt: new Date(),
        } as Record<string, unknown>)
        .where(eq(cols.id, localId));
      return { skipped: false, conflict: false, notified: false };
    }

    // Genuine conflict: local edits vs a server change.
    const resolution = resolveConflict(
      { data: local, version: localVersion },
      { data: { ...data }, version: record.version, deleted: record.deleted },
    );
    await db
      .update(table as SQLiteTable)
      .set({
        ...(resolution.data as Record<string, unknown>),
        version: record.version,
        syncStatus: resolution.syncStatus,
        lastSyncedAt: new Date(),
      } as Record<string, unknown>)
      .where(eq(cols.id, localId));
    return { skipped: false, conflict: true, notified: resolution.notifyUser };
  }
}

/**
 * App-wide engine. Offline-only until Phase 8 calls
 * `syncEngine.setTransport(...)` with the HTTP transport.
 */
export const syncEngine = new SyncEngine();
