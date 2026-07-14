import 'dotenv/config';

import { scheduleCleanupJob } from './lib/queue.js';
import { startCleanupWorker } from './workers/CleanupWorker.js';

/**
 * Standalone entry point for the background-worker process — run separately
 * from the HTTP server (`index.ts`) via the `worker` npm script, since sync
 * push stays synchronous inline in the route handler and doesn't need a
 * queue (see docs/Phases.md Phase 8).
 */
const worker = startCleanupWorker();

worker.on('completed', (job) => {
  console.log(`[worker] cleanup job ${job.id} completed`, job.returnvalue);
});

worker.on('failed', (job, err) => {
  console.error(`[worker] cleanup job ${job?.id} failed:`, err.message);
});

scheduleCleanupJob()
  .then(() => console.log('[worker] nightly cleanup schedule registered'))
  .catch((err) => {
    console.error('[worker] failed to register cleanup schedule:', err);
    process.exit(1);
  });
