import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000000,
    hookTimeout: 10000000,
  },
});
