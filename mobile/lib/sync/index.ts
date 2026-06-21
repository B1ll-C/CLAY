// Public surface of the sync module.
export { SyncEngine, syncEngine, type SyncResult } from "./SyncEngine";
export type { SyncTransport } from "./SyncTransport";
export {
  resolveConflict,
  type ConflictResolution,
  type ConflictSide,
} from "./conflict";
export {
  syncCreatePatch,
  syncUpdatePatch,
  syncDeletePatch,
} from "./stamping";
export { getLastPullAt, setLastPullAt } from "./syncSettings";
export {
  SYNCED_TABLE_REGISTRY,
  tableFor,
  type SyncedTableEntry,
} from "./tableRegistry";
