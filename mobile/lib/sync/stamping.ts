import type { SyncStatus } from "@clay/shared";

/**
 * Row-side sync patches. Feature controllers (Phase 4/5) spread these into their
 * Drizzle `values()` / `set()` calls so every local write leaves the row in the
 * right pending state, then call `SyncController.enqueue` to record the outbox
 * entry. Keeping the two in lockstep is what makes the app offline-correct.
 *
 * `version` is the optimistic-concurrency counter: it is bumped on every local
 * edit and compared against the server's version to detect conflicts.
 */

interface CreatePatch {
  syncStatus: SyncStatus;
  updatedAt: Date;
}

interface UpdatePatch {
  syncStatus: SyncStatus;
  version: number;
  updatedAt: Date;
}

interface DeletePatch {
  syncStatus: SyncStatus;
  version: number;
  updatedAt: Date;
  deletedAt: Date;
}

/** Patch for a freshly created, never-synced row. */
export function syncCreatePatch(now: Date = new Date()): CreatePatch {
  return { syncStatus: "pending_create", updatedAt: now };
}

/**
 * Patch for an edit to an existing row. A `pending_create` row stays
 * `pending_create` (it still only needs a single CREATE push); anything else
 * becomes `pending_update`.
 */
export function syncUpdatePatch(
  current: { version: number; syncStatus: SyncStatus },
  now: Date = new Date(),
): UpdatePatch {
  return {
    syncStatus:
      current.syncStatus === "pending_create" ? "pending_create" : "pending_update",
    version: current.version + 1,
    updatedAt: now,
  };
}

/** Patch for a soft delete (tombstone). */
export function syncDeletePatch(
  current: { version: number },
  now: Date = new Date(),
): DeletePatch {
  return {
    syncStatus: "pending_delete",
    version: current.version + 1,
    updatedAt: now,
    deletedAt: now,
  };
}
