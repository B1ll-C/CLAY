import type { SyncStatus } from "@clay/shared";

/**
 * One side of a conflict. `data` is the full record as that side sees it.
 */
export interface ConflictSide<T> {
  data: T;
  version: number;
}

export interface ConflictResolution<T> {
  /** The record to persist locally after resolution. */
  data: T;
  /** Status to stamp on the resolved row. */
  syncStatus: SyncStatus;
  /** True for destructive outcomes the user should be told about. */
  notifyUser: boolean;
  /** Short machine-readable reason, for logs and UI copy. */
  reason: "server-wins" | "server-delete-over-local-edit" | "no-conflict";
}

/**
 * Resolve a divergence between a locally-edited record and the server's version.
 *
 * Policy (see docs/OfflineStrategy.md):
 *  - Server deleted a record the user edited locally → server delete wins, but
 *    flag it so the UI can notify (destructive, non-obvious to the user).
 *  - Otherwise the server is authoritative (last-write-wins). Without per-field
 *    timestamps this means the server record replaces the local one wholesale;
 *    Phase 8 can refine to true per-field merge if the protocol grows them.
 *
 * Locally-created records (no server counterpart) are not conflicts — the push
 * path assigns their `server_id` — so callers should not route them here.
 */
export function resolveConflict<T>(
  local: ConflictSide<T>,
  server: ConflictSide<T> & { deleted: boolean },
): ConflictResolution<T> {
  if (server.deleted) {
    return {
      data: server.data,
      syncStatus: "pending_delete",
      notifyUser: true,
      reason: "server-delete-over-local-edit",
    };
  }

  return {
    data: server.data,
    syncStatus: "synced",
    notifyUser: false,
    reason: "server-wins",
  };
}
