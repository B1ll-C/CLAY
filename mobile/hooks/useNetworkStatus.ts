import { useEffect, useState } from "react";
import { Platform } from "react-native";

export interface NetworkStatus {
  /** Device has a network link. */
  isConnected: boolean;
  /** The wider internet is reachable (≈ isConnected until NetInfo lands). */
  isInternetReachable: boolean;
}

// Accessed without pulling in DOM lib types — these globals only exist on web.
const webGlobal = globalThis as unknown as {
  navigator?: { onLine?: boolean };
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function currentlyOnline(): boolean {
  if (Platform.OS === "web") {
    return webGlobal.navigator?.onLine ?? true;
  }
  // Optimistic on native: there is no NetInfo dependency yet, so we assume
  // connectivity. Phase 8 swaps this for @react-native-community/netinfo, which
  // delivers real connectivity transitions to drive sync.
  return true;
}

/**
 * Connectivity signal for the SyncEngine and UI. On web it tracks the browser's
 * online/offline events; on native it currently reports optimistically (see
 * `currentlyOnline`). The shape is stable so Phase 8 can drop in NetInfo without
 * touching callers.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState<boolean>(currentlyOnline);

  useEffect(() => {
    if (Platform.OS !== "web" || !webGlobal.addEventListener) return;
    const goOnline = () => setIsConnected(true);
    const goOffline = () => setIsConnected(false);
    webGlobal.addEventListener("online", goOnline);
    webGlobal.addEventListener("offline", goOffline);
    return () => {
      webGlobal.removeEventListener?.("online", goOnline);
      webGlobal.removeEventListener?.("offline", goOffline);
    };
  }, []);

  return { isConnected, isInternetReachable: isConnected };
}
