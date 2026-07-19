import { syncPullResponseSchema, syncPushRequestSchema, syncPushResponseSchema } from '@clay/shared';
import type { FastifyInstance } from 'fastify';

import { requireAuth } from '../middleware/auth.js';
import { SyncService } from '../services/SyncService.js';

export async function syncRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/sync/push', { preHandler: requireAuth }, async (request) => {
    const { changes } = syncPushRequestSchema.parse(request.body);
    const response = await SyncService.applyPush(request.userId!, changes);
    return syncPushResponseSchema.parse(response);
  });

  app.get('/api/v1/sync/pull', { preHandler: requireAuth }, async (request) => {
    const query = request.query as Record<string, unknown>;
    const since = Number(query?.since ?? 0);
    const response = await SyncService.pull(request.userId!, Number.isFinite(since) ? since : 0);
    return syncPullResponseSchema.parse(response);
  });
}
