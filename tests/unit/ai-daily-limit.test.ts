// AI 每日额度判定 —— 「到期感知」回归测试
//
// 背景：曾经出现过「用户已过期（页面显示免费版），但 AI 生成仍然无限」的问题。
// 根因是 canUseAiToday 直接读 User.subscriptionTier，而该字段要等每天 UTC 00:00（北京 08:00）
// 的 expire-sweep 才降级，且该任务只在正式环境跑（preview 永远不跑）→ 空窗期里免费额度形同虚设。
// 现在改成走 effectiveTier()，与用户页面同一套判断。本文件把这个行为钉死。
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores, seedUsageDaily } from './_helpers/mock-prisma'
import { AI_DAILY_LIMIT } from '@cookmate/shared/constants/usage-limits'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { canUseAiToday } from '@/lib/auth-helpers'

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

beforeEach(() => {
  resetPrisma()
})

describe('canUseAiToday — 到期感知', () => {
  it('PRO 且未过期 → 不限次数（额度用超也放行）', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', subscriptionExpiryDate: daysFromNow(30) })
    seedUsageDaily('u1', AI_DAILY_LIMIT + 100)
    expect(await canUseAiToday('u1')).toBe(true)
  })

  it('PRO 但已过期 → 按免费版扣额度（这是曾出过线上问题的场景）', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', subscriptionExpiryDate: daysFromNow(-1) })
    seedUsageDaily('u1', AI_DAILY_LIMIT)
    expect(await canUseAiToday('u1')).toBe(false)
  })

  it('PRO 但已过期且额度未用完 → 仍允许（只是按免费额度算，不是直接封禁）', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', subscriptionExpiryDate: daysFromNow(-1) })
    seedUsageDaily('u1', AI_DAILY_LIMIT - 1)
    expect(await canUseAiToday('u1')).toBe(true)
  })

  it('PRO 且没有到期日 → 视为永久，不限次数', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', subscriptionExpiryDate: null })
    seedUsageDaily('u1', AI_DAILY_LIMIT + 100)
    expect(await canUseAiToday('u1')).toBe(true)
  })

  it('FREE 且额度未用完 → 允许', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null })
    seedUsageDaily('u1', 0)
    expect(await canUseAiToday('u1')).toBe(true)
  })

  it('FREE 且额度已用完 → 拒绝', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null })
    seedUsageDaily('u1', AI_DAILY_LIMIT)
    expect(await canUseAiToday('u1')).toBe(false)
  })

  it('用户不存在 → 拒绝（fail-closed）', async () => {
    expect(await canUseAiToday('not-exist')).toBe(false)
  })
})
