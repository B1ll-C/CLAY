import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { syncEngine } from "@/lib/sync";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * Fires a sync cycle at the trigger points `SyncEngine`'s doc comment
 * promises: a deferred run once signed in, the app returning to the
 * foreground, and connectivity being restored. All three are no-ops while
 * signed out (no transport is armed, so `syncEngine.sync()` just reports
 * `offline: true`). Successful cycles invalidate every query so pulled
 * changes show up across tabs, not just the screen that triggered them.
 */
export function useAutoSync(): void {
  const status = useAuthStore((s) => s.status);
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const online = isConnected && isInternetReachable;
  const queryClient = useQueryClient();
  const wasOnline = useRef(online);

  function runSync() {
    syncEngine.sync().then(() => queryClient.invalidateQueries());
  }

  // Deferred run once signed in (transport is armed by AuthBootstrap first).
  useEffect(() => {
    if (status === "signedIn") runSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // App foreground.
  useEffect(() => {
    if (status !== "signedIn") return;
    const subscription = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (next === "active") runSync();
      },
    );
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Connectivity restored.
  useEffect(() => {
    if (status === "signedIn" && online && !wasOnline.current) runSync();
    wasOnline.current = online;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, online]);
}
