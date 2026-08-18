import { defineConfig } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: '../../tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL,
  },
  webServer: {
    command: 'pnpm --filter cookmate-web dev',
    port: Number(new URL(baseURL).port) || 3000,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
})
