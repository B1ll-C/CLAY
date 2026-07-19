/**
 * Backend base URL for the Phase 8 API. Set `EXPO_PUBLIC_API_URL` in
 * `mobile/.env` (see `mobile/.env.example`) — Metro inlines `EXPO_PUBLIC_*`
 * vars with no extra plugin, so this is the only env mechanism this repo uses.
 */
export function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not set — copy mobile/.env.example to mobile/.env and point it at the backend.",
    );
  }
  return url.replace(/\/$/, "");
}
