import {
  AUTH_LOGIN_PATH,
  AUTH_LOGOUT_PATH,
  AUTH_REFRESH_PATH,
  AUTH_REGISTER_PATH,
  type AuthTokens,
} from "@clay/shared";

import { getApiBaseUrl } from "@/lib/apiConfig";

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

/** Thrown on any non-2xx response from an auth route; `code` mirrors the backend's `error.code`. */
export class AuthApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;

  const data = (await response.json().catch(() => ({}))) as ApiErrorBody & T;
  if (!response.ok) {
    const err = (data as ApiErrorBody).error;
    throw new AuthApiError(
      response.status,
      err?.code ?? "UNKNOWN_ERROR",
      err?.message ?? `Request to ${path} failed with status ${response.status}`,
    );
  }
  return data as T;
}

/** Thin fetch client for the Phase 8 auth routes (`backend/src/routes/auth.ts`). */
export const AuthClient = {
  register(email: string, password: string): Promise<AuthTokens> {
    return postJson<AuthTokens>(AUTH_REGISTER_PATH, { email, password });
  },

  login(email: string, password: string): Promise<AuthTokens> {
    return postJson<AuthTokens>(AUTH_LOGIN_PATH, { email, password });
  },

  refresh(refreshToken: string): Promise<AuthTokens> {
    return postJson<AuthTokens>(AUTH_REFRESH_PATH, { refreshToken });
  },

  logout(refreshToken: string): Promise<void> {
    return postJson<void>(AUTH_LOGOUT_PATH, { refreshToken });
  },
};
