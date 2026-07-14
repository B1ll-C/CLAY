import { Queue, type ConnectionOptions } from 'bullmq';

/**
 * Plain connection options rather than a shared `ioredis` instance — BullMQ
 * vendors its own `ioredis` internally, and passing an instance created from
 * this repo's top-level `ioredis` dependency fails to type-check against
 * BullMQ's bundled (and possibly differently-versioned) copy. Letting each
 * Queue/Worker construct its own connection from these options sidesteps
 * that entirely. BullMQ also requires `maxRetriesPerRequest: null` here
 * since it issues blocking commands (BRPOPLPUSH etc.).
 */
function parseConnectionOptions(): ConnectionOptions {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

export const queueConnection: ConnectionOptions = parseConnectionOptions();

export const CLEANUP_QUEUE_NAME = 'cleanup';

export const cleanupQueue = new Queue(CLEANUP_QUEUE_NAME, { connection: queueConnection });

cleanupQueue.on('error', (err) => {
  console.error('[queue:cleanup]', err.message);
});

/**
 * Registers the nightly purge as a BullMQ repeatable job. Repeatable jobs are
 * deduped by name + repeat pattern, so calling this on every worker startup
 * (rather than once via a separate migration step) is safe and idempotent.
 */
export async function scheduleCleanupJob() {
  await cleanupQueue.add(
    'purge-soft-deletes',
    {},
    {
      repeat: { pattern: '0 3 * * *' },
    },
  );
}
