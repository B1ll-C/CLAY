import AsyncStorage from "expo-sqlite/kv-store";

/**
 * Tiny persistent key/value for sync bookkeeping that lives outside the synced
 * tables — currently the pull cursor. Backed by expo-sqlite's kv-store so it
 * survives restarts without its own migration.
 */
const LAST_PULL_AT_KEY = "sync.lastPullAt";

/** Last server time (unix seconds) we successfully pulled up to, or null. */
export async function getLastPullAt(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(LAST_PULL_AT_KEY);
  if (raw == null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function setLastPullAt(serverTime: number): Promise<void> {
  await AsyncStorage.setItem(LAST_PULL_AT_KEY, String(serverTime));
}
