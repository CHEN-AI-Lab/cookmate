// auth-helpers 单元测试：canUseAiToday / incrementAiUsage / isDemoUser
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores, seedUsageDaily } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
// 防止加载真实 NextAuth 配置（仅需纯函数）
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { canUseAiToday, incrementAiUsage, isDemoUser } from '@/lib/auth-helpers'

beforeEach(() => resetPrisma())

describe('isDemoUser', () => {
  it('demo id → true', () => expect(isDemoUser({ user: { id: 'demo-user-id' } })).toBe(true))
  it('demo email → true', () => expect(isDemoUser({ user: { email: 'demo@cookmate.local' } })).toBe(true))
  it('正常用户 → false', () => expect(isDemoUser({ user: { id: 'u1', email: 'a@b.com' } })).toBe(false))
  it('null → false', () => expect(isDemoUser(null)).toBe(false))
})

describe('canUseAiToday', () => {
  it('PRO 用户 → true（不限）', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', subscriptionExpiryDate: null })
    expect(await canUseAiToday('u1')).toBe(true)
  })
  it('PRO 但已过期 → true（降级交给 cron，接口不提前限制）', async () => {
    const past = new Date(); past.setDate(past.getDate() - 1)
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', subscriptionExpiryDate: past })
    expect(await canUseAiToday('u1')).toBe(true)
  })
  it('FREE 未达每日上限 → true', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null })
    expect(await canUseAiToday('u1')).toBe(true)
  })
  it('FREE 已达每日上限(1) → false', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null })
    seedUsageDaily('u1', 1)
    expect(await canUseAiToday('u1')).toBe(false)
  })
  it('用户不存在 → false', async () => {
    expect(await canUseAiToday('nope')).toBe(false)
  })
})

describe('incrementAiUsage', () => {
  it('首次生成 → 创建 usage 记录 recipeCount=1', async () => {
    stores.users.set('u1', { id: 'u1' })
    await incrementAiUsage('u1')
    const keys = [...stores.usage.keys()]
    expect(keys.length).toBe(1)
    expect(stores.usage.get(keys[0]).recipeCount).toBe(1)
  })
  it('再次生成 → 累加为 2', async () => {
    stores.users.set('u1', { id: 'u1' })
    await incrementAiUsage('u1')
    await incrementAiUsage('u1')
    const k = [...stores.usage.keys()][0]
    expect(stores.usage.get(k).recipeCount).toBe(2)
  })
})
