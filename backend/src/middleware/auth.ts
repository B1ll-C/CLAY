import type { FastifyReply, FastifyRequest } from 'fastify';

import { ApiError } from '../lib/errors.js';
import { AuthService } from '../services/AuthService.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

/**
 * Verifies `Authorization: Bearer <token>` and attaches `request.userId`.
 * Applied per-route via `{ preHandler: requireAuth }` (Fastify has no global
 * auth gate here since /health* and /api/v1/auth/* stay public).
 */
export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  if (!token) {
    throw new ApiError(401, 'MISSING_TOKEN', 'Authorization header with a Bearer token is required');
  }
  request.userId = await AuthService.verifyAccessToken(token);
}
