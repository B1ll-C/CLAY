import { QueryClient } from "@tanstack/react-query";

/**
 * Shared React Query client for the app.
 *
 * Defaults are tuned for a mostly-offline mobile app: data stays fresh for a
 * minute, failed queries retry a couple of times, and we never refetch on
 * window focus (there is no window focus on native).
 *
 * The online/focus managers (NetInfo + AppState integration) are wired in
 * Phase 3 alongside the SyncEngine — see docs/SyncEngine.md.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
