// Auth contract shared by the mobile AuthClient (Phase 8 mobile wiring) and the
// backend auth routes (Phase 8). Keeping these in one place guarantees both
// ends agree on endpoint paths and token lifetimes.
export const AUTH_REGISTER_PATH = '/api/v1/auth/register';
export const AUTH_LOGIN_PATH = '/api/v1/auth/login';
export const AUTH_REFRESH_PATH = '/api/v1/auth/refresh';
export const AUTH_LOGOUT_PATH = '/api/v1/auth/logout';

/** Access token (JWT) lifetime. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/** Refresh token (opaque, Redis-backed) lifetime. */
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
