import Fastify, { type FastifyInstance } from 'fastify';
import { checkDbConnection } from './db/index.js';

/**
 * Builds the Fastify application with all routes registered. Kept separate from
 * server startup (index.ts) so routes can be exercised in tests via
 * `app.inject()` without binding a port. Feature route plugins are registered
 * here as the API grows (Phase 4+).
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get('/health', async () => {
    return { status: 'ok', version: '0.1.0', uptime: process.uptime() };
  });

  // Verifies the PostgreSQL connection. Returns 200 when reachable, 503
  // otherwise (including when DATABASE_URL is unset), so the server itself
  // stays up without a database — see docs/Architecture.md.
  app.get('/health/db', async (_request, reply) => {
    const result = await checkDbConnection();
    reply.code(result.ok ? 200 : 503);
    return { status: result.ok ? 'ok' : 'unavailable', ...result };
  });

  return app;
}
