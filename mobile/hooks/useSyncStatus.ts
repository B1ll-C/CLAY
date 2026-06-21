import { SyncController } from "@/controller/SyncController";
import { syncEngine, type SyncResult } from "@/lib/sync";
import { getLastPullAt } from "@/lib/sync/syncSettings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const syncStatusKeys = {
  status: ["sync-status"] as const,
};

export interface SyncStatusSnapshot {
  /** Mutations still waiting in the outbox. */
  pendingCount: number;
  /** Last server time (unix seconds) pulled, or null if never. */
  lastPullAt: number | null;
}

/**
 * Exposes sync state to the UI: the pending-change count (for a badge), the
 * last-synced time, and a `sync()` trigger for pull-to-refresh. Triggering runs
 * the engine and refreshes the snapshot; in Phase 3's offline-only mode the
 * engine reports `offline: true` and the counts simply reflect the local queue.
 */
export function useSyncStatus() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: syncStatusKeys.status,
    queryFn: async (): Promise<SyncStatusSnapshot> => ({
      pendingCount: await SyncController.pendingCount(),
      lastPullAt: await getLastPullAt(),
    }),
  });

  const mutation = useMutation({
    mutationFn: (): Promise<SyncResult> => syncEngine.sync(),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: syncStatusKeys.status }),
  });

  return {
    pendingCount: query.data?.pendingCount ?? 0,
    lastPullAt: query.data?.lastPullAt ?? null,
    isLoading: query.isLoading,
    isSyncing: mutation.isPending,
    lastResult: mutation.data,
    /** Run a sync cycle now (e.g. pull-to-refresh). */
    sync: mutation.mutateAsync,
  };
}
