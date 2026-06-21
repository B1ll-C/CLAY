import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // `generate` works offline; `migrate`/`push`/`studio` use this URL.
    url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/clay',
  },
  strict: true,
  verbose: true,
});
