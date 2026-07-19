import { loginInputSchema, logoutInputSchema, refreshInputSchema, registerInputSchema } from '@clay/shared';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';
import { ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { AuthService } from '../services/AuthService.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/auth/register', async (request, reply) => {
    const { email, password } = registerInputSchema.parse(request.body);
    const tokens = await AuthService.register(email, password);
    reply.code(201);
    return tokens;
  });

  app.post('/api/v1/auth/login', async (request) => {
    const { email, password } = loginInputSchema.parse(request.body);
    return AuthService.login(email, password);
  });

  app.post('/api/v1/auth/refresh', async (request) => {
    const { refreshToken } = refreshInputSchema.parse(request.body);
    return AuthService.refresh(refreshToken);
  });

  app.post('/api/v1/auth/logout', async (request, reply) => {
    const { refreshToken } = logoutInputSchema.parse(request.body);
    await AuthService.logout(refreshToken);
    reply.code(204);
  });

  // Protected stub — exercises the auth middleware end to end without
  // depending on any other Phase 8 route (sync/barcode land in later PRs).
  app.get('/api/v1/me', { preHandler: requireAuth }, async (request) => {
    const user = await db.query.users.findFirst({ where: eq(users.id, request.userId!) });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User no longer exists');
    }
    return { id: user.id, email: user.email };
  });
}
