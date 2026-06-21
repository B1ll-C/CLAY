// Wire-format schemas for the sync protocol. These define the request/response
// contract between the mobile SyncEngine (Phase 3) and the backend sync routes
// (Phase 8). Both ends validate against these so the protocol can't drift.
import { z } from 'zod';

import { SYNC_OPERATIONS, SYNC_STATUSES } from '../constants/sync';

export const syncStatusSchema = z.enum(SYNC_STATUSES);
export const syncOperationSchema = z.enum(SYNC_OPERATIONS);

/** A bag of changed columns; `null` for a DELETE. */
const payloadSchema = z.record(z.string(), z.unknown()).nullable();

/** One pending local mutation, drained from `sync_queue` and pushed up. */
export const syncChangeSchema = z.object({
  table: z.string(),
  operation: syncOperationSchema,
  /** Local autoincrement id — lets the client reconcile the server's ack. */
  recordId: z.number().int(),
  /** Set for UPDATE/DELETE of records the server already knows about. */
  serverId: z.string().nullable().optional(),
  /** Local version at the time the change was queued (conflict detection). */
  version: z.number().int().nonnegative(),
  payload: payloadSchema,
  /** Unix seconds. */
  updatedAt: z.number().int(),
});
export type SyncChange = z.infer<typeof syncChangeSchema>;

/** Body of `POST /api/v1/sync/push`. */
export const syncPushRequestSchema = z.object({
  changes: z.array(syncChangeSchema),
});
export type SyncPushRequest = z.infer<typeof syncPushRequestSchema>;

/** Server's per-change acknowledgement. */
export const syncPushResultSchema = z.object({
  table: z.string(),
  recordId: z.number().int(),
  status: z.enum(['applied', 'conflict']),
  /** Server id assigned (CREATE) or echoed back. */
  serverId: z.string().nullable(),
  /** Authoritative version after the server applied the change. */
  version: z.number().int(),
});
export type SyncPushResult = z.infer<typeof syncPushResultSchema>;

export const syncPushResponseSchema = z.object({
  results: z.array(syncPushResultSchema),
  /** Server clock (unix seconds) — clients store this as `last_pull_at`. */
  serverTime: z.number().int(),
});
export type SyncPushResponse = z.infer<typeof syncPushResponseSchema>;

/** One record returned by `GET /api/v1/sync/pull?since=`. */
export const syncRecordSchema = z.object({
  table: z.string(),
  serverId: z.string(),
  version: z.number().int(),
  /** Tombstone flag — the server soft-deleted this record. */
  deleted: z.boolean(),
  data: z.record(z.string(), z.unknown()),
  updatedAt: z.number().int(),
});
export type SyncRecord = z.infer<typeof syncRecordSchema>;

export const syncPullResponseSchema = z.object({
  records: z.array(syncRecordSchema),
  serverTime: z.number().int(),
});
export type SyncPullResponse = z.infer<typeof syncPullResponseSchema>;
