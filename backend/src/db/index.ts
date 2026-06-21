import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

/**
 * PostgreSQL connection + Drizzle instance for the backend.
 *
 * The client is created lazily — `postgres()` does not open a socket until the
 * first query — so importing this module (and starting the server) works even
 * when no database is running. Point DATABASE_URL at a Postgres instance to
 * enable the /health/db check and real queries.
 */
const connectionString = process.env.DATABASE_URL ?? '';

export const queryClient = postgres(connectionString, {
  // Stay quiet on NOTICE messages; surface real failures per-query instead.
  onnotice: () => {},
});

export const db = drizzle(queryClient, { schema });

/** Lightweight connectivity probe used by the /health/db route. */
export async function checkDbConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!connectionString) {
    return { ok: false, error: 'DATABASE_URL is not set' };
  }
  try {
    await queryClient`select 1`;
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
