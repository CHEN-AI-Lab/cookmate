import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3001',
  },
  webServer: {
    command: 'pnpm --filter cookmate-web dev',
    port: 3001,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
})
