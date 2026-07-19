import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, type JWTVerifyGetKey } from 'jose';

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

let supabaseClient: SupabaseClient | undefined;
let supabaseAdminClient: SupabaseClient | undefined;
let supabaseJwksSet: JWTVerifyGetKey | undefined;

/**
 * User-context Supabase client (publishable/anon key) — used for the
 * password-auth flows (signUp/signInWithPassword/refreshSession) that
 * `AuthService` proxies on the caller's behalf.
 *
 * Built lazily, mirroring `db/index.ts` and `lib/redis.ts`'s lazy-connect
 * pattern, so importing this module (and anything that imports it, like
 * `app.ts`'s route registration) doesn't require SUPABASE_URL/etc. to be set
 * — only calling an auth route does.
 */
export function getSupabase(): SupabaseClient {
  supabaseClient ??= createClient(
    supabaseUrl(),
    process.env.SUPABASE_PUBLISHABLE_KEY ?? '',
    nodeClientOptions,
  );
  return supabaseClient;
}

/**
 * Admin client (secret/service_role key) — backend-only, never sent to
 * mobile. Used solely to revoke a session by access token at logout.
 */
export function getSupabaseAdmin(): SupabaseClient {
  supabaseAdminClient ??= createClient(
    supabaseUrl(),
    process.env.SUPABASE_SECRET_KEY ?? '',
    nodeClientOptions,
  );
  return supabaseAdminClient;
}

/**
 * Supabase Auth's JWKS endpoint, for verifying access tokens with `jose`
 * instead of a shared HS256 secret. `createRemoteJWKSet` caches/rotates keys
 * internally, respecting Supabase's ~10-minute edge cache.
 */
export function getSupabaseJwks(): JWTVerifyGetKey {
  supabaseJwksSet ??= createRemoteJWKSet(
    new URL('/auth/v1/.well-known/jwks.json', supabaseUrl()),
  );
  return supabaseJwksSet;
}
