import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export interface NetworkStatus {
  /** Device has a network link. */
  isConnected: boolean;
  /** The wider internet is reachable (≈ isConnected on web, where there's no separate signal). */
  isInternetReachable: boolean;
}

// Accessed without pulling in DOM lib types — these globals only exist on web.
const webGlobal = globalThis as unknown as {
  navigator?: { onLine?: boolean };
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function initialStatus(): NetworkStatus {
  if (Platform.OS === "web") {
    const online = webGlobal.navigator?.onLine ?? true;
    return { isConnected: online, isInternetReachable: online };
  }
  // Optimistic until NetInfo's first callback fires below.
  return { isConnected: true, isInternetReachable: true };
}

/**
 * Connectivity signal for the SyncEngine and UI. On web it tracks the
 * browser's online/offline events; on native it's backed by
 * `@react-native-community/netinfo`, which delivers real connectivity
 * transitions (including reachability, not just link state) to drive sync.
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(initialStatus);

  useEffect(() => {
    if (Platform.OS === "web") {
      if (!webGlobal.addEventListener) return;
      const goOnline = () =>
        setStatus({ isConnected: true, isInternetReachable: true });
      const goOffline = () =>
        setStatus({ isConnected: false, isInternetReachable: false });
      webGlobal.addEventListener("online", goOnline);
      webGlobal.addEventListener("offline", goOffline);
      return () => {
        webGlobal.removeEventListener?.("online", goOnline);
        webGlobal.removeEventListener?.("offline", goOffline);
      };
    }

    return NetInfo.addEventListener((state) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? state.isConnected ?? false,
      });
    });
  }, []);

  return status;
}
