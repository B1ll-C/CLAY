/**
 * Wipes all app data from the Supabase database except `users` (and
 * Supabase's own `auth.users`, which this backend never manages) — truncates
 * every domain table plus `sync_log` so the account tree resets to empty
 * without losing accounts.
 *
 * Usage (from backend/):
 *   npm run reset            # prompts for confirmation
 *   npm run reset -- --yes   # skips the prompt
 *
 * Env: DATABASE_URL (required — see .env.example)
 */
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import postgres from 'postgres';

const TABLES = [
  'sync_log',
  'inventory_movements',
  'store_prices',
  'shopping_list_items',
  'inventory_items',
  'shopping_lists',
  'stores',
  'products',
];

function hostOf(connectionString: string): string {
  try {
    const url = new URL(connectionString.replace(/^postgres(ql)?:\/\//, 'postgres://'));
    return `${url.hostname}${url.pathname}`;
  } catch {
    return '(unparseable DATABASE_URL)';
  }
}

async function confirm(host: string): Promise<boolean> {
  if (process.argv.includes('--yes')) return true;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    `This will TRUNCATE ${TABLES.length} tables (everything except users) on ${host}.\n` +
      `Type RESET to confirm: `,
  );
  rl.close();
  return answer.trim() === 'RESET';
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — cannot reset.');
  }

  const host = hostOf(connectionString);
  if (!(await confirm(host))) {
    console.log('Aborted — no changes made.');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });
  try {
    const identifiers = TABLES.map((t) => `"${t}"`).join(', ');
    await sql.unsafe(`TRUNCATE TABLE ${identifiers} RESTART IDENTITY CASCADE`);
    console.log(`✅ Truncated on ${host}: ${TABLES.join(', ')} (users preserved)`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
