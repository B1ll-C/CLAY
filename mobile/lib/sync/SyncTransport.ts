import type {
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
} from "@clay/shared";

/**
 * Network boundary for the SyncEngine. The engine is transport-agnostic: it
 * drains the queue and merges records, while a transport owns the HTTP details.
 *
 * Phase 3 ships no transport — the engine runs in offline-only mode (queueing
 * locally, never reaching out). Phase 8 injects an HTTP implementation that
 * talks to `POST /api/v1/sync/push` and `GET /api/v1/sync/pull`.
 */
export interface SyncTransport {
  push(request: SyncPushRequest): Promise<SyncPushResponse>;
  /** `since` is the last server time (unix seconds) seen, or null on first pull. */
  pull(since: number | null): Promise<SyncPullResponse>;
}
