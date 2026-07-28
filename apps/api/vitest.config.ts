import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    env: {
      MONGOMS_DOWNLOAD_DIR: 's:/B.TECH CSE/Project 2/LAPS/.cache/mongodb',
    },
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
