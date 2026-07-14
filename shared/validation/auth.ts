// Wire-format schemas for the auth protocol (Phase 8) — the contract between
// the mobile AuthClient and the backend auth routes.
import { z } from 'zod';

export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = registerInputSchema;
export type LoginInput = z.infer<typeof loginInputSchema>;

export const refreshInputSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshInputSchema>;

export const logoutInputSchema = refreshInputSchema;
export type LogoutInput = z.infer<typeof logoutInputSchema>;

/** Response body for register/login/refresh — a fresh token pair. */
export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;
