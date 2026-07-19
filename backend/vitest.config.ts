import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Routes import services (AuthService -> supabase.ts) that read
    // SUPABASE_URL/etc. at module load time, same as the real server does
    // via index.ts's `import 'dotenv/config'`.
    setupFiles: ['dotenv/config'],
  },
});
