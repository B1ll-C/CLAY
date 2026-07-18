import { createClient } from '@supabase/supabase-js';
import { createRemoteJWKSet } from 'jose';

function supabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL is not set');
  }
  return url;
}

// Node has no localStorage and this process never needs a background
// refresh timer of its own — every call already carries the caller's token.
const nodeClientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

/**
 * User-context Supabase client (publishable/anon key) — used for the
 * password-auth flows (signUp/signInWithPassword/refreshSession) that
 * `AuthService` proxies on the caller's behalf.
 */
export const supabase = createClient(
  supabaseUrl(),
  process.env.SUPABASE_PUBLISHABLE_KEY ?? '',
  nodeClientOptions,
);

/**
 * Admin client (secret/service_role key) — backend-only, never sent to
 * mobile. Used solely to revoke a session by access token at logout.
 */
export const supabaseAdmin = createClient(
  supabaseUrl(),
  process.env.SUPABASE_SECRET_KEY ?? '',
  nodeClientOptions,
);

/**
 * Supabase Auth's JWKS endpoint, for verifying access tokens with `jose`
 * instead of a shared HS256 secret. `createRemoteJWKSet` caches/rotates keys
 * internally, respecting Supabase's ~10-minute edge cache.
 */
export const supabaseJwks = createRemoteJWKSet(
  new URL('/auth/v1/.well-known/jwks.json', supabaseUrl()),
);
