// dashboard GET 路由测试：订阅等级判定、canceled 标记、过期降级、体验用户
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@cookmate/shared/api/alipay-pay', () => ({ isAlipayConfigured: vi.fn(() => false) }))
vi.mock('@cookmate/shared/api/creem', () => ({ isCreemConfigured: vi.fn(() => false) }))
vi.mock('@cookmate/shared/utils/locale', () => ({ getLocaleFromCookie: () => 'zh-CN', err: (l: string, k: string) => k }))

import { auth } from '@/lib/auth'
import { GET } from '@/app/api/dashboard/route'

function getReq() {
  return new Request('http://localhost/api/dashboard', { method: 'GET' })
}

beforeEach(() => {
  resetPrisma()
  ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'u1@x.com' } })
})

function seed(overrides: any = {}) {
  stores.users.set('u1', {
    id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null,
    creemSubscriptionId: null,
    email: 'u1@x.com', ...overrides,
  })
}

describe('dashboard GET', () => {
  it('未登录 → 401', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await GET(getReq())
    expect(res.status).toBe(401)
  })
  it('FREE → tier FREE, canceled=false', async () => {
    seed()
    const res = await GET(getReq())
    const json = await res.json()
    expect(json.subscriptionTier).toBe('FREE')
    expect(json.canceled).toBe(false)
  })
  it('PRO + creemSubscriptionId → PRO, canceled=false', async () => {
    seed({ subscriptionTier: 'PRO', creemSubscriptionId: 'creem_sub_1' })
    const res = await GET(getReq())
    const json = await res.json()
    expect(json.subscriptionTier).toBe('PRO')
    expect(json.canceled).toBe(false)
  })
  it('PRO + 无任何订阅ID → canceled=true', async () => {
    seed({ subscriptionTier: 'PRO' })
    const res = await GET(getReq())
    const json = await res.json()
    expect(json.subscriptionTier).toBe('PRO')
    expect(json.canceled).toBe(true)
  })
  it('PRO 但已过期 → 返回 FREE（降级由 expire-sweep 定时任务处理，GET 不写库）', async () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    seed({ subscriptionTier: 'PRO', subscriptionExpiryDate: past, creemSubscriptionId: 'creem_sub_1' })
    const res = await GET(getReq())
    const json = await res.json()
    // UI 上显示 FREE（因为已过期），但 DB 中仍是 PRO（等 cron 降级）
    expect(json.subscriptionTier).toBe('FREE')
    expect(stores.users.get('u1').subscriptionTier).toBe('PRO') // DB 未变
  })
  it('体验用户 → isDemoUser=true', async () => {
    seed()
    ;(auth as any).mockResolvedValue({ user: { id: 'demo', email: 'demo@cookmate.local' } })
    stores.users.set('demo', { id: 'demo', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, email: 'demo@cookmate.local' })
    const res = await GET(getReq())
    const json = await res.json()
    expect(json.isDemoUser).toBe(true)
  })
  it('统计字段返回', async () => {
    seed()
    stores.recipes.set('r1', { id: 'r1', userId: 'u1', starred: true })
    const res = await GET(getReq())
    const json = await res.json()
    expect(json.pantryCount).toBe(0)
    expect(json.starredCount).toBe(1)
    expect(json.todayUsage).toBe(0)
    expect(json.creemConfigured).toBe(false)
  })
})
