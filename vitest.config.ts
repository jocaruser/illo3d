import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: ['node_modules/', 'src/test/', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'vite.config.ts', 'vitest.config.ts'],
    },
  },
});
