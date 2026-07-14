import {
  SYNC_PULL_PATH,
  SYNC_PUSH_PATH,
  type SyncPullResponse,
  type SyncPushRequest,
  type SyncPushResponse,
} from "@clay/shared";

import { getApiBaseUrl } from "@/lib/apiConfig";
import { useAuthStore } from "@/store/authStore";

import { SyncTransport } from "./SyncTransport";

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Real network implementation of `SyncTransport`, injected via
 * `syncEngine.setTransport(new HttpSyncTransport())` once a session exists
 * (see `app/_layout.tsx`). Reads the access token from the auth store fresh
 * on every call rather than capturing it at construction, so one instance
 * survives token rotation without needing to be recreated.
 */
export class HttpSyncTransport implements SyncTransport {
  async push(request: SyncPushRequest): Promise<SyncPushResponse> {
    return this.request<SyncPushResponse>("POST", SYNC_PUSH_PATH, request);
  }

  async pull(since: number | null): Promise<SyncPullResponse> {
    return this.request<SyncPullResponse>(
      "GET",
      `${SYNC_PULL_PATH}?since=${since ?? 0}`,
    );
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) throw new Error("Not authenticated");

    try {
      return await this.send<T>(method, path, accessToken, body);
    } catch (err) {
      if (!(err instanceof HttpError) || err.status !== 401) throw err;

      // One silent refresh-and-retry, per the Phase 8 plan.
      const refreshed = await useAuthStore.getState().refreshAccessToken();
      if (!refreshed) throw err;
      return this.send<T>(method, path, refreshed, body);
    }
  }

  private async send<T>(
    method: string,
    path: string,
    accessToken: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message =
        (data as { error?: { message?: string } }).error?.message ??
        `${method} ${path} failed with status ${response.status}`;
      throw new HttpError(response.status, message);
    }
    return (await response.json()) as T;
  }
}
