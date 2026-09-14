// trackEvent 埋点工具测试：未配置静默跳过 / 正确 payload / 失败不抛错
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const fetchMock = vi.fn(async () => ({ ok: true }))

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
  fetchMock.mockClear()
})

describe('trackEvent', () => {
  it('未配置 NEXT_PUBLIC_WORKER_URL → 不发任何请求（本地开发静默）', async () => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_WORKER_URL
    const { trackEvent } = await import('@cookmate/shared/utils/track')
    await expect(trackEvent('ai_generate')).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('已配置 → POST 正确 payload（事件名/环境/平台）', async () => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_WORKER_URL = 'https://worker.example'
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'production'
    const { trackEvent } = await import('@cookmate/shared/utils/track')
    await trackEvent('ai_generate')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://worker.example/track')
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body)
    expect(body).toEqual({ project: 'cookmate', tool: 'ai_generate', type: 'tool', env: 'production', platform: 'web' })
  })

  it('请求失败 → 不抛错，业务零影响', async () => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_WORKER_URL = 'https://worker.example'
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    const { trackEvent } = await import('@cookmate/shared/utils/track')
    await expect(trackEvent('register')).resolves.toBeUndefined()
  })
})
