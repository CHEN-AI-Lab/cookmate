// 数据导出 API 测试：金额按币种显示
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/auth-helpers', () => ({ isDemoUser: vi.fn(() => false) }))
// 导出 API 调用的 alipay/creem 配置检查，默认返回 false 不影响导出
vi.mock('@cookmate/shared/api/alipay-pay', () => ({ isAlipayConfigured: vi.fn(() => false) }))
vi.mock('@cookmate/shared/api/creem', () => ({ isCreemConfigured: vi.fn(() => false) }))

import { auth } from '@/lib/auth'
import { prismaMock } from './_helpers/mock-prisma'
import { GET } from '@/app/api/user/export/route'

function mockOrders(orders: any[]) {
  ;(prismaMock.paymentOrder.findMany as any).mockResolvedValue(orders)
}

beforeEach(() => {
  resetPrisma()
  ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
  // 模拟空的用户数据（避免 recipe.findMany 等未 mock 的调用）
  ;(prismaMock.user.findUnique as any).mockResolvedValue(null)
  ;(prismaMock.recipe.findMany as any).mockResolvedValue([])
  ;(prismaMock.mealPlan.findMany as any).mockResolvedValue([])
  ;(prismaMock.pantryItem.findMany as any).mockResolvedValue([])
  ;(prismaMock.groceryItem.findMany as any).mockResolvedValue([])
})

describe('用户数据导出', () => {
  it('包含 USD 订单 → 导出金额显示 $', async () => {
    mockOrders([
      {
        id: 'ord1', orderId: 'CKCR20260901XXXX', userId: 'u1', channel: 'creem',
        amount: 499, currency: 'USD', status: 'PAID', createdAt: new Date('2026-09-01T10:00:00Z'),
      },
      {
        id: 'ord2', orderId: 'CKAL20260901YYYY', userId: 'u1', channel: 'alipay',
        amount: 2900, currency: 'CNY', status: 'PAID', createdAt: new Date('2026-09-01T11:00:00Z'),
      },
    ])

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.orders).toHaveLength(2)

    const creemOrder = json.orders.find((o: any) => o.channel === 'creem')
    const alipayOrder = json.orders.find((o: any) => o.channel === 'alipay')

    expect(creemOrder.amount).toBe('$4.99')
    expect(alipayOrder.amount).toBe('¥29.00')
  })

  it('currency=null 历史订单 → 默认显示 ¥', async () => {
    mockOrders([
      {
        id: 'old1', orderId: 'CKCR20260701ZZZZ', userId: 'u1', channel: 'creem',
        amount: 2000, currency: null, status: 'PAID', createdAt: new Date('2026-07-01T10:00:00Z'),
      },
    ])

    const res = await GET()
    const json = await res.json()
    const order = json.orders[0]
    expect(order.amount).toBe('¥20.00') // currency=null 时兜底显示 ¥
  })

  it('未登录 → 401', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('demo 用户 → 403', async () => {
    const { isDemoUser } = await import('@/lib/auth-helpers')
    ;(isDemoUser as any).mockReturnValue(true)
    const res = await GET()
    expect(res.status).toBe(403)
  })
})
