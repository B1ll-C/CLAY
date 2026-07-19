import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Standalone migration runner: applies everything in ./drizzle to the database
 * pointed at by DATABASE_URL. Run with `npm run db:migrate` from backend/.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — cannot run migrations.');
  }

  // postgres.js requires a single connection (max: 1) for migrations.
  const migrationClient = postgres(connectionString, { max: 1 });
  try {
    await migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' });
    console.log('✅ Migrations applied.');
  } finally {
    await migrationClient.end();
  }
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
