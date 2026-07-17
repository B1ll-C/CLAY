import { jwtVerify } from 'jose';

import { ApiError } from '../lib/errors.js';
import { supabase, supabaseAdmin, supabaseJwks } from '../lib/supabase.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** New-project default ("Confirm email" ON) makes signUp return no session — see docs/Supabase.md. */
function requireSession(session: { access_token: string; refresh_token: string } | null): AuthTokens {
  if (!session) {
    throw new ApiError(
      500,
      'EMAIL_CONFIRMATION_ENABLED',
      'Supabase project has "Confirm email" enabled; disable it so sign-up returns a session immediately (see docs/Supabase.md)',
    );
  }
  return { accessToken: session.access_token, refreshToken: session.refresh_token };
}

export const AuthService = {
  async register(email: string, password: string): Promise<AuthTokens> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (error.status === 400 && /registered/i.test(error.message)) {
        throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
      }
      throw new ApiError(400, 'REGISTER_FAILED', error.message);
    }
    return requireSession(data.session);
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
    }
    return requireSession(data.session);
  },

  /** Rotates a refresh token: the old one stops working the moment a new pair is issued. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) {
      throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
    }
    return requireSession(data.session);
  },

  /** Best-effort: rotates the refresh token, then revokes the resulting session server-side. */
  async logout(refreshToken: string): Promise<void> {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return;
    await supabaseAdmin.auth.admin.signOut(data.session.access_token, 'global').catch(() => {});
  },

  /** Verifies an access token's signature/expiry (via Supabase's JWKS) and returns the userId. */
  async verifyAccessToken(token: string): Promise<string> {
    let sub: unknown;
    try {
      ({
        payload: { sub },
      } = await jwtVerify(token, supabaseJwks));
    } catch {
      throw new ApiError(401, 'INVALID_TOKEN', 'Access token is invalid or expired');
    }
    if (typeof sub !== 'string') {
      throw new ApiError(401, 'INVALID_TOKEN', 'Access token is invalid or expired');
    }
    return sub;
  },
};
