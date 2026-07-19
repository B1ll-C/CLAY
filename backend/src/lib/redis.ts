import Redis from 'ioredis';

/**
 * Lazy ioredis client, mirroring `db/index.ts`'s lazy-connect pattern — importing
 * this module doesn't open a socket until the first command, so the server can
 * start even when Redis isn't reachable yet.
 */
export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  // Swallow here — callers see the rejected promise; this just stops ioredis
  // from crashing the process on an unhandled 'error' event.
  console.error('[redis]', err.message);
});
