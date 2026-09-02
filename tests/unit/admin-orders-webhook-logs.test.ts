// admin/orders + admin/webhook-logs GET 路由测试：鉴权、数据返回、统计
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { auth } from '@/lib/auth'
import { GET as ordersGET } from '@/app/api/admin/orders/route'
import { GET as webhookLogsGET } from '@/app/api/admin/webhook-logs/route'

const sampleOrders = [
  { id: 'o1', orderId: 'CKCR20260901AABBCCDD', channel: 'creem', period: 'annual', amount: 16900, status: 'PAID', createdAt: new Date('2026-09-01T10:00:00Z'), user: { email: 'a@x.com' } },
  { id: 'o2', orderId: 'CKAL20260831EEFF0011', channel: 'alipay', period: null, amount: 2000, status: 'PENDING', createdAt: new Date('2026-08-31T09:00:00Z'), user: { email: null } },
]

const sampleWebhookLogs = [
  { id: 'w1', source: 'creem', eventType: 'subscription.paid', status: 'processed', eventId: 'evt_1', createdAt: new Date('2026-09-01T10:00:00Z'), rawBody: JSON.stringify({ foo: 'bar' }) },
  { id: 'w2', source: 'alipay', eventType: 'trade.status.sync', status: 'failed:signature', eventId: null, createdAt: new Date('2026-08-31T09:00:00Z'), rawBody: null },
]

beforeEach(() => {
  resetPrisma()
  process.env.ADMIN_EMAIL = 'admin@cookmate.com'
  prismaMock.paymentOrder.findMany.mockResolvedValue(sampleOrders)
  prismaMock.webhookLog.findMany.mockResolvedValue(sampleWebhookLogs)
})

describe('admin orders GET', () => {
  it('未登录 → 401', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await ordersGET()
    expect(res.status).toBe(401)
  })

  it('非管理员 → 403', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'user@x.com' } })
    const res = await ordersGET()
    expect(res.status).toBe(403)
  })

  it('ADMIN_EMAIL 未配置 → 403（fail-closed）', async () => {
    delete process.env.ADMIN_EMAIL
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'admin@cookmate.com' } })
    const res = await ordersGET()
    expect(res.status).toBe(403)
    expect(prismaMock.paymentOrder.findMany).not.toHaveBeenCalled()
  })

  it('正常路径 → 返回订单 + 统计（paidCount / totalRevenue）', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'admin@cookmate.com' } })
    const res = await ordersGET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(2)
    expect(json.paidCount).toBe(1)
    expect(json.totalRevenue).toBe(16900)
    expect(json.orders[0]).toMatchObject({
      orderId: 'CKCR20260901AABBCCDD',
      channel: 'creem',
      period: 'annual',
      userEmail: 'a@x.com',
    })
    // 无邮箱的用户 → null，不抛错
    expect(json.orders[1].userEmail).toBeNull()
    // period 为空（历史订单）→ null 透传
    expect(json.orders[1].period).toBeNull()
  })
})

describe('admin webhook-logs GET', () => {
  it('未登录 → 401', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await webhookLogsGET()
    expect(res.status).toBe(401)
  })

  it('非管理员 → 403', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'user@x.com' } })
    const res = await webhookLogsGET()
    expect(res.status).toBe(403)
  })

  it('正常路径 → 返回回调流水（rawPreview 截断 / rawBody 空为 ""）+ 失败统计', async () => {
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'admin@cookmate.com' } })
    const res = await webhookLogsGET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(2)
    expect(json.failed).toBe(1)
    expect(json.logs[0]).toMatchObject({
      source: 'creem',
      eventType: 'subscription.paid',
      status: 'processed',
      eventId: 'evt_1',
    })
    expect(json.logs[0].rawPreview).toContain('foo')
    expect(json.logs[1].rawPreview).toBe('')
  })

  it('超长 rawBody → rawPreview 截断到 300 字符', async () => {
    prismaMock.webhookLog.findMany.mockResolvedValue([
      { id: 'w3', source: 'creem', eventType: 'x', status: 'received', eventId: null, createdAt: new Date(), rawBody: 'x'.repeat(1000) },
    ])
    ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'admin@cookmate.com' } })
    const res = await webhookLogsGET()
    const json = await res.json()
    expect(json.logs[0].rawPreview).toHaveLength(300)
  })
})
