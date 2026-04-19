import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    singleFork: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/migrations/**', 'src/scripts/**', 'src/index.ts'],
    },
  },
});
