// api-error 工具测试：错误分类、超时、安全解析
// 背景：以前所有失败都提示"网络错误"，这里固化分类行为，防止回退。
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  ApiTimeoutError,
  fetchWithTimeout,
  parseJsonSafely,
  classifyNetworkError,
  classifyHttpError,
  emptyDataError,
  kindToMessageKey,
  errorLogContext,
} from '@cookmate/shared/utils/api-error'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('classifyNetworkError', () => {
  it('ApiTimeoutError → timeout，可重试', () => {
    const info = classifyNetworkError(new ApiTimeoutError(90000))
    expect(info.kind).toBe('timeout')
    expect(info.status).toBe(0)
    expect(info.retryable).toBe(true)
  })
  it('fetch 的 TypeError（Failed to fetch）→ network', () => {
    const info = classifyNetworkError(new TypeError('Failed to fetch'))
    expect(info.kind).toBe('network')
    expect(info.retryable).toBe(true)
    // detail 要保留原始信息，便于日志定位
    expect(info.detail).toContain('Failed to fetch')
  })
  it('非 Error 对象也能安全分类', () => {
    const info = classifyNetworkError('boom')
    expect(info.kind).toBe('network')
    expect(info.detail).toBe('boom')
  })
})

describe('classifyHttpError', () => {
  const mkRes = (status: number) => new Response('{}', { status, statusText: 'Err' })

  it('401 → unauthorized，不可重试（重试也没用，得先登录）', () => {
    const info = classifyHttpError(mkRes(401), { error: '请先登录' })
    expect(info.kind).toBe('unauthorized')
    expect(info.retryable).toBe(false)
    expect(info.detail).toContain('请先登录')
  })
  it('429 → rateLimit，不可重试', () => {
    const info = classifyHttpError(mkRes(429), { error: '今日次数已用完' })
    expect(info.kind).toBe('rateLimit')
    expect(info.retryable).toBe(false)
  })
  it('403 → paymentRequired', () => {
    expect(classifyHttpError(mkRes(403), null).kind).toBe('paymentRequired')
  })
  it('500 → server，可重试', () => {
    const info = classifyHttpError(mkRes(500), { detail: 'db down' })
    expect(info.kind).toBe('server')
    expect(info.retryable).toBe(true)
    expect(info.detail).toContain('db down')
  })
  it('502/504 同样归入 server（平台超时会被解析成非 JSON）', () => {
    expect(classifyHttpError(mkRes(504), null).kind).toBe('server')
  })
  it('data 为 null（HTML 响应）时仍能出分类', () => {
    const info = classifyHttpError(mkRes(500), null)
    expect(info.kind).toBe('server')
    expect(info.detail).toBeTruthy()
  })
})

describe('parseJsonSafely', () => {
  it('正常 JSON → 对象', async () => {
    const data = await parseJsonSafely(new Response('{"plan":{"slots":[]}}', { status: 200 }))
    expect(data).toEqual({ plan: { slots: [] } })
  })
  it('HTML / 非 JSON → null，不抛异常（避免"网络错误"掩盖 504）', async () => {
    const data = await parseJsonSafely(new Response('<html>504 Gateway Timeout</html>', { status: 504 }))
    expect(data).toBeNull()
  })
  it('空响应体 → null', async () => {
    expect(await parseJsonSafely(new Response('', { status: 200 }))).toBeNull()
  })
})

describe('fetchWithTimeout', () => {
  it('正常返回时透传 Response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":1}', { status: 200 })))
    const res = await fetchWithTimeout('/api/x', { timeoutMs: 1000 })
    expect(res.status).toBe(200)
  })
  it('超时后抛 ApiTimeoutError', async () => {
    // 模拟一个永远不返回、但会响应 abort 的请求
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('AbortError')))
          }),
      ),
    )
    await expect(fetchWithTimeout('/api/x', { timeoutMs: 30 })).rejects.toBeInstanceOf(ApiTimeoutError)
  })
})

describe('辅助函数', () => {
  it('emptyDataError 标记为空数据且可重试', () => {
    const info = emptyDataError('plan.slots missing')
    expect(info.kind).toBe('emptyData')
    expect(info.retryable).toBe(true)
  })
  it('kindToMessageKey 与 messages 里的键对应', () => {
    expect(kindToMessageKey('timeout')).toBe('genError_timeout')
    expect(kindToMessageKey('unauthorized')).toBe('genError_unauthorized')
  })
  it('errorLogContext 含分类、状态码与 detail，便于排查', () => {
    const line = errorLogContext('meal-plan:generate', classifyHttpError(new Response('{}', { status: 500 }), { detail: 'boom' }))
    expect(line).toContain('meal-plan:generate')
    expect(line).toContain('kind=server')
    expect(line).toContain('status=500')
    expect(line).toContain('boom')
  })
})
