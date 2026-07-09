import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    preserveSymlinks: true,
  },
  test: {
    environment: 'jsdom',
    css: false,
    globals: false,
    include: ['src/**/*.test.{ts,tsx,js,jsx}'],
    exclude: ['node_modules', 'dist', 'tests/**'],
  },
});
