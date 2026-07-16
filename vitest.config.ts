import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const isCi = process.env.CI === 'true'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/Unit/setup.ts'],
    globals: true,
    include: ['tests/Unit/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules', 'dist'],
    ...(isCi ? { maxWorkers: 2 } : {}),
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // main.tsx only wires the DOM entry point; everything it composes is covered.
      exclude: ['src/main.tsx'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
})
