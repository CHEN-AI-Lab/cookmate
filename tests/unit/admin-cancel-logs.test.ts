// admin/cancel-logs GET 路由测试：鉴权、权限校验（ADMIN_EMAIL 缺失 / 大小写 / 正常路径）
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { auth } from '@/lib/auth'
import { GET } from '@/app/api/admin/cancel-logs/route'

function getReq() {
  return new Request('http://localhost/api/admin/cancel-logs', { method: 'GET' })
}

const sampleLogs = [
  { id: 'wl1', source: 'cancel', eventType: 'creem', status: 'completed', rawBody: JSON.stringify({ userId: 'u1', subscriptionId: 'sub_1' }), createdAt: new Date('2026-08-25T10:00:00Z') },
  { id: 'wl2', source: 'cancel', eventType: 'stripe', status: 'failed', rawBody: JSON.stringify({ userId: 'u2', subscriptionId: 'sub_2', error: 'api down' }), createdAt: new Date('2026-08-25T09:00:00Z') },
]

beforeEach(() => {
  resetPrisma()
  process.env.ADMIN_EMAIL = 'admin@cookmate.com'
  // mock prisma.webhookLog.findMany 返回样本日志
  prismaMock.webhookLog.findMany.mockResolvedValue(sampleLogs)
})

describe('admin cancel-logs GET', () => {
  it('未登录 → 401', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await GET(getReq())
    expect(res.status).toBe(401)
  })

  it('非管理员（邮箱不匹配）→ 403', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'user@cookmate.com' } })
    const res = await GET(getReq())
    expect(res.status).toBe(403)
  })

  it('ADMIN_EMAIL 未配置 → 403（安全默认，fail-closed）', async () => {
    delete process.env.ADMIN_EMAIL
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'admin@cookmate.com' } })
    const res = await GET(getReq())
    expect(res.status).toBe(403)
    // findMany 不应被调用（权限检查在 DB 查询之前）
    expect(prismaMock.webhookLog.findMany).not.toHaveBeenCalled()
  })

  it('邮箱大小写不敏感 → 放行（ADMIN_EMAIL=admin@cookmate.com, user email=ADMIN@CookMate.COM）', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'ADMIN@CookMate.COM' } })
    const res = await GET(getReq())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(2)
    expect(json.failed).toBe(1)
    expect(json.completed).toBe(1)
    expect(json.logs).toHaveLength(2)
  })

  it('正常路径 → 返回解析后的日志 + 统计', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'admin@cookmate.com' } })
    const res = await GET(getReq())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(2)
    expect(json.failed).toBe(1)
    expect(json.completed).toBe(1)
    expect(json.lastFailedAt).toBe('2026-08-25T09:00:00.000Z')
    expect(json.logs[0]).toMatchObject({
      id: 'wl1',
      channel: 'creem',
      status: 'completed',
      userId: 'u1',
      subscriptionId: 'sub_1',
      error: '',
    })
    expect(json.logs[1]).toMatchObject({
      id: 'wl2',
      channel: 'stripe',
      status: 'failed',
      userId: 'u2',
      subscriptionId: 'sub_2',
      error: 'api down',
    })
    // 按 createdAt desc 排序（最新在前）
    expect(json.logs[0].createdAt >= json.logs[1].createdAt).toBe(true)
  })

  it('rawBody 非合法 JSON → detail 为空对象，不抛错', async () => {
    prismaMock.webhookLog.findMany.mockResolvedValue([
      { id: 'wl3', source: 'cancel', eventType: 'creem', status: 'failed', rawBody: 'not-json', createdAt: new Date() },
    ])
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'admin@cookmate.com' } })
    const res = await GET(getReq())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.logs[0].userId).toBeNull()
    expect(json.logs[0].error).toBe('')
  })

  it('无 cancel 日志 → 返回空列表', async () => {
    prismaMock.webhookLog.findMany.mockResolvedValue([])
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'admin@cookmate.com' } })
    const res = await GET(getReq())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(0)
    expect(json.failed).toBe(0)
    expect(json.completed).toBe(0)
    expect(json.logs).toEqual([])
  })
})
