import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['../../tests/unit/**/*.test.ts', '../../shared/tests/**/*.test.ts'],
    pool: 'forks',
    maxWorkers: 1,
    maxConcurrency: 5,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@cookmate/shared': path.resolve(__dirname, '../../shared'),
    },
  },
})