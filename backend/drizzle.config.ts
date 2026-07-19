import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // `generate` works offline; `migrate`/`push`/`studio` use this URL.
    url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/clay',
  },
  // Supabase owns `auth`/`storage`/`realtime` — never let drizzle-kit diff or
  // try to manage those schemas, only the app's own `public` schema.
  schemaFilter: ['public'],
  strict: true,
  verbose: true,
});
