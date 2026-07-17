# Supabase backend (alternative to local Postgres)

`feat/supabase-backend` replaces the backend's local Postgres + custom
bcrypt/JWT auth with a hosted Supabase project. Drizzle ORM is unchanged —
it's still the only thing that talks to the database; Supabase is used as
managed Postgres + Auth, not via PostgREST/supabase-js for data.

## One-time project setup

1. Create a project at supabase.com.
2. **Settings → Authentication → Sign In / Providers → Email**: disable
   "Confirm email". Without this, `signUp` returns no session until the user
   clicks an email link, which breaks the app's contract that register/login
   return usable tokens immediately.
3. **Settings → Database → Connection string → Session pooler**: copy into
   `backend/.env` as `DATABASE_URL`. This backend is a long-running server
   (not serverless), but the Session pooler avoids needing IPv6 support on
   your network, which the Direct connection requires by default.
4. **Settings → API**: copy the project URL, publishable (`anon`) key, and
   secret (`service_role`) key into `backend/.env` (`SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`). The secret key never
   leaves the backend — it's only used to revoke a session at logout.
5. **SQL editor**: run `backend/supabase/001_sync_auth_users.sql` once. This
   keeps `public.users` (the app's slim profile row) in sync with Supabase
   Auth's own `auth.users` table whenever someone signs up.
6. From `backend/`: `npx drizzle-kit generate && npx drizzle-kit migrate` (or
   `npm run db:generate` / `npm run db:migrate`) to create every other table
   (`products`, `inventory_items`, `shopping_lists`, …) in the `public`
   schema of the new database.

## What changed vs. the local-Postgres branch

- `docker-compose.yml` no longer runs a local `postgres` container — only
  `redis` (still needed for BullMQ's `CleanupWorker` and the barcode cache).
- `backend/src/db/schema/users.ts` — `public.users` now FKs to `auth.users`
  (via `pgSchema('auth')`) instead of owning its own password hash.
- `backend/src/services/AuthService.ts` — proxies Supabase Auth
  (`signUp`/`signInWithPassword`/`refreshSession`/admin `signOut`) instead of
  bcrypt + self-signed JWTs + Redis-backed refresh tokens. Access tokens are
  verified via Supabase's JWKS endpoint (`backend/src/lib/supabase.ts`).
- **Mobile is unchanged.** `AuthService` still returns the same
  `{ accessToken, refreshToken }` shape over the same `/api/v1/auth/*`
  routes, so `authStore`, `AuthClient`, and `HttpSyncTransport`'s
  refresh-and-retry logic all keep working as-is.
- Token lifetimes are now controlled by the Supabase project's Auth settings
  instead of `shared/constants/auth.ts`.
