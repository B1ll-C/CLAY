import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

/**
 * Thrown by services/routes for any expected failure (bad credentials, a
 * conflicting sync push, etc.). `registerErrorHandler` turns these into the
 * `{ error: { code, message, details? } }` response shape documented in
 * docs/Phases.md's Phase 8 API standards.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Registers a single Fastify error handler so every route — auth, sync,
 * barcode — returns the same error envelope without repeating try/catch
 * boilerplate. Unexpected errors are logged server-side but never leak their
 * message or stack to the client.
 */
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, request, reply) => {
    if (err instanceof ApiError) {
      reply.code(err.statusCode);
      return { error: { code: err.code, message: err.message, ...(err.details !== undefined ? { details: err.details } : {}) } };
    }

    if (err instanceof ZodError) {
      reply.code(400);
      return { error: { code: 'VALIDATION_ERROR', message: 'Request failed validation', details: err.issues } };
    }

    request.log.error(err);
    reply.code(500);
    return { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
  });
}
