import { create } from "zustand";
import type { AuthTokens } from "@clay/shared";

import { AuthApiError, AuthClient } from "@/lib/auth/AuthClient";
import { SecureTokenStore } from "@/lib/auth/SecureTokenStore";

type AuthStatus = "hydrating" | "signedOut" | "signedIn";

type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;

  /** Reads any tokens already in the keychain from a previous launch. */
  hydrate: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Rotates tokens via `/auth/refresh`; returns the new access token, or null if the session is dead. */
  refreshAccessToken: () => Promise<string | null>;
};

async function applyTokens(
  set: (partial: Partial<AuthState>) => void,
  tokens: AuthTokens,
): Promise<void> {
  await SecureTokenStore.setTokens(tokens);
  set({
    status: "signedIn",
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    error: null,
  });
}

function describeError(err: unknown): string {
  if (err instanceof AuthApiError) return err.message;
  return err instanceof Error ? err.message : String(err);
}

/**
 * Session state, backed by expo-secure-store (never AsyncStorage — tokens are
 * sensitive). Unlike `uiStore`, this store owns real persisted identity, so it
 * starts in `"hydrating"` and reads the keychain before deciding whether the
 * user is signed in.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  status: "hydrating",
  accessToken: null,
  refreshToken: null,
  error: null,

  hydrate: async () => {
    const tokens = await SecureTokenStore.getTokens();
    if (tokens) {
      set({
        status: "signedIn",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } else {
      set({ status: "signedOut" });
    }
  },

  register: async (email, password) => {
    try {
      const tokens = await AuthClient.register(email, password);
      await applyTokens(set, tokens);
    } catch (err) {
      set({ error: describeError(err) });
      throw err;
    }
  },

  login: async (email, password) => {
    try {
      const tokens = await AuthClient.login(email, password);
      await applyTokens(set, tokens);
    } catch (err) {
      set({ error: describeError(err) });
      throw err;
    }
  },

  logout: async () => {
    const refreshToken = get().refreshToken;
    await SecureTokenStore.clearTokens();
    set({ status: "signedOut", accessToken: null, refreshToken: null, error: null });
    if (refreshToken) {
      // Best-effort — an already-expired/deleted refresh token is a no-op server-side.
      await AuthClient.logout(refreshToken).catch(() => {});
    }
  },

  refreshAccessToken: async () => {
    const refreshToken = get().refreshToken;
    if (!refreshToken) return null;
    try {
      const tokens = await AuthClient.refresh(refreshToken);
      await applyTokens(set, tokens);
      return tokens.accessToken;
    } catch {
      // Refresh token is dead (expired/rotated/logged-out elsewhere) — drop the session.
      await get().logout();
      return null;
    }
  },
}));
