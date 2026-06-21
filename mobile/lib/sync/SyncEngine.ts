import { db } from "@/models/db";
import { SyncController } from "@/controller/SyncController";
import type { SyncChange, SyncRecord, SyncStatus } from "@clay/shared";
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
    // server_id/version (the queue stores neither).
    const changes: SyncChange[] = [];
    const queueIdByKey = new Map<string, number>();
    for (const entry of pending) {
      const meta = await this.loadRowMeta(entry.tableName, entry.recordId);
      changes.push({
        table: entry.tableName,
        operation: entry.operation,
        recordId: entry.recordId,
        serverId: meta?.serverId ?? null,
        version: meta?.version ?? 0,
        payload: entry.payload
          ? (JSON.parse(entry.payload) as Record<string, unknown>)
          : null,
        updatedAt: Math.floor((entry.createdAt?.getTime() ?? Date.now()) / 1000),
      });
      queueIdByKey.set(`${entry.tableName}:${entry.recordId}`, entry.id);
    }

    let pushed = 0;
    let conflicts = 0;
    try {
      const response = await this.transport.push({ changes });
      for (const result of response.results) {
        const queueId = queueIdByKey.get(`${result.table}:${result.recordId}`);
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
      for (const entry of pending) {
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
        ...record.data,
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
          ...record.data,
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
      { data: { ...record.data }, version: record.version, deleted: record.deleted },
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
