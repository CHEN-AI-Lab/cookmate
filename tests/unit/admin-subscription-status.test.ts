// 后台「用户订阅状态」判定 + 「到期感知有效套餐」的单元测试
// 这两处都是权限/展示的判定核心，顺序写反过一次（先看订阅ID、后看到期日 → 过期用户显示「订阅中」），
// 用测试把顺序钉死。
import { describe, it, expect } from 'vitest'
import { deriveSubscriptionStatus } from '@cookmate/shared/utils/admin-query'
import { effectiveTier, isExpired, isPaidTier } from '@cookmate/shared/utils/subscription'
import { SUBSCRIPTION_TIER } from '@cookmate/shared/constants'

const NOW = new Date('2026-09-11T00:00:00Z')
const YESTERDAY = new Date('2026-09-10T00:00:00Z')
const TOMORROW = new Date('2026-09-12T00:00:00Z')

function derive(over: Partial<Parameters<typeof deriveSubscriptionStatus>[0]> = {}) {
  return deriveSubscriptionStatus({
    isPaid: true,
    creemSubscriptionId: null,
    creemSubscriptionStatus: null,
    subscriptionExpiryDate: TOMORROW,
    lastPaidChannel: null,
    now: NOW,
    ...over,
  })
}

describe('deriveSubscriptionStatus — 基础口径', () => {
  it('免费用户 → free', () => {
    expect(derive({ isPaid: false })).toBe('free')
    expect(derive({ isPaid: false, creemSubscriptionStatus: 'active' })).toBe('free')
  })

  it('PRO 且到期日已过 → expired（优先级高于 Creem 官方状态与订阅ID）', () => {
    expect(derive({ subscriptionExpiryDate: YESTERDAY })).toBe('expired')
    expect(derive({ subscriptionExpiryDate: YESTERDAY, creemSubscriptionId: 'sub_1' })).toBe('expired')
    expect(derive({ subscriptionExpiryDate: YESTERDAY, creemSubscriptionStatus: 'active' })).toBe('expired')
  })

  it('PRO 且没有到期日 → 视为永久，不判过期', () => {
    expect(derive({ subscriptionExpiryDate: null, creemSubscriptionId: 'sub_1' })).toBe('active')
  })
})

describe('deriveSubscriptionStatus — Creem 官方状态优先', () => {
  it.each([
    ['active', 'active'],
    ['trialing', 'active'],
    ['scheduled_cancel', 'canceled'],
    ['canceled', 'canceled'],
    ['past_due', 'issue'],
    ['unpaid', 'issue'],
    ['incomplete', 'issue'],
    ['paused', 'paused'],
  ])('官方状态 %s → %s', (official, expected) => {
    expect(derive({ creemSubscriptionStatus: official })).toBe(expected)
  })

  it('官方状态 expired → expired', () => {
    expect(derive({ creemSubscriptionStatus: 'expired' })).toBe('expired')
  })

  it('官方状态优先于本地反推（有订阅ID也不会被当成 active）', () => {
    expect(derive({ creemSubscriptionStatus: 'paused', creemSubscriptionId: 'sub_1' })).toBe('paused')
  })

  it('陈旧官方状态不能压过之后的支付宝买断（取消 Creem 后又用支付宝买断一期）', () => {
    // creemSubscriptionId 已被取消时清空，最近一笔已支付是支付宝 → 应以「一次性」为准
    expect(derive({ creemSubscriptionStatus: 'canceled', lastPaidChannel: 'alipay' })).toBe('onetime')
    expect(derive({ creemSubscriptionStatus: 'expired', lastPaidChannel: 'alipay' })).toBe('onetime')
  })

  it('没有支付记录时仍以官方状态为准', () => {
    expect(derive({ creemSubscriptionStatus: 'canceled', lastPaidChannel: null })).toBe('canceled')
  })
})

describe('deriveSubscriptionStatus — 没有官方状态时的本地兜底', () => {
  it('有 Creem 订阅ID → active', () => {
    expect(derive({ creemSubscriptionId: 'sub_1' })).toBe('active')
  })

  it('最近一笔已支付是支付宝 → onetime（一次性买断，不是取消）', () => {
    expect(derive({ lastPaidChannel: 'alipay' })).toBe('onetime')
  })

  it('最近一笔已支付是 Creem 且没有订阅ID → canceled', () => {
    expect(derive({ lastPaidChannel: 'creem' })).toBe('canceled')
  })

  it('什么依据都没有 → unknown', () => {
    expect(derive({})).toBe('unknown')
  })
})

describe('effectiveTier — 到期感知的有效套餐', () => {
  it('非 PRO → FREE', () => {
    expect(effectiveTier('FREE', null)).toBe(SUBSCRIPTION_TIER.FREE)
    expect(effectiveTier(null, null)).toBe(SUBSCRIPTION_TIER.FREE)
    expect(effectiveTier(undefined, null)).toBe(SUBSCRIPTION_TIER.FREE)
  })

  it('PRO 但没有到期日 → 视为永久 PRO', () => {
    expect(effectiveTier('PRO', null)).toBe(SUBSCRIPTION_TIER.PRO)
  })

  it('PRO 且到期日已过 → FREE（不等定时任务降级）', () => {
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(isExpired(past)).toBe(true)
    expect(effectiveTier('PRO', past)).toBe(SUBSCRIPTION_TIER.FREE)
  })

  it('PRO 且到期日在未来 → PRO', () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    expect(effectiveTier('PRO', future)).toBe(SUBSCRIPTION_TIER.PRO)
  })

  it('大小写不敏感（pro / Pro 都认）', () => {
    expect(effectiveTier('pro', null)).toBe(SUBSCRIPTION_TIER.PRO)
    expect(effectiveTier('Pro', null)).toBe(SUBSCRIPTION_TIER.PRO)
  })

  it('FAMILY 等其它付费档必须原样保留，绝不能被当成 FREE', () => {
    // openai.ts 的 normalizeTier 明确写着「PRO / FAMILY 走付费端」；
    // 早期版本把「非 PRO 一律返回 FREE」，会让家庭版用户白丢付费额度。
    expect(effectiveTier(SUBSCRIPTION_TIER.FAMILY, null)).toBe(SUBSCRIPTION_TIER.FAMILY)
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    expect(effectiveTier(SUBSCRIPTION_TIER.FAMILY, future)).toBe(SUBSCRIPTION_TIER.FAMILY)
    // 到期了才降级（与 PRO 同一口径）
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(effectiveTier(SUBSCRIPTION_TIER.FAMILY, past)).toBe(SUBSCRIPTION_TIER.FREE)
  })
})

describe('isPaidTier — 付费档判定（不要用 tier === PRO）', () => {
  it('FREE / 空值 → false', () => {
    expect(isPaidTier(SUBSCRIPTION_TIER.FREE)).toBe(false)
    expect(isPaidTier('free')).toBe(false)
    expect(isPaidTier(null)).toBe(false)
    expect(isPaidTier(undefined)).toBe(false)
    expect(isPaidTier('')).toBe(false)
  })

  it('PRO / FAMILY 等付费档 → true', () => {
    expect(isPaidTier(SUBSCRIPTION_TIER.PRO)).toBe(true)
    expect(isPaidTier('pro')).toBe(true)
    expect(isPaidTier(SUBSCRIPTION_TIER.FAMILY)).toBe(true)
  })
})
