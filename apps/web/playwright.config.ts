import { defineConfig } from '@playwright/test'
import { execSync } from 'child_process'

// 动态扫描 dev server 端口，避免硬编码
// 优先级：PLAYWRIGHT_BASE_URL 环境变量 > find-dev-server.sh 扫描结果 > 默认 3000
function resolveBaseURL(): string {
  if (process.env.PLAYWRIGHT_BASE_URL) {
    return process.env.PLAYWRIGHT_BASE_URL
  }

  // CI 环境跳过扫描，直接用默认端口（webServer 会自动启动）
  if (process.env.CI) {
    return 'http://localhost:3000'
  }

  try {
    const port = execSync('bash scripts/find-dev-server.sh', {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()

    if (port && /^\d+$/.test(port)) {
      return `http://localhost:${port}`
    }
  } catch {
    // 扫描失败或脚本不存在，静默回退到默认端口
  }

  return 'http://localhost:3000'
}

const baseURL = resolveBaseURL()

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
