// 取消订阅端点测试：Creem / Stripe 双渠道（修复：原实现只处理 Creem）
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
import { auth } from '@/lib/auth'
vi.mock('@cookmate/shared/api/creem', () => ({ cancelSubscription: vi.fn(async () => {}) }))
vi.mock('@cookmate/shared/api/stripe', () => ({ cancelStripeSubscription: vi.fn(async () => {}) }))
import { cancelSubscription } from '@cookmate/shared/api/creem'
import { cancelStripeSubscription } from '@cookmate/shared/api/stripe'

import { POST as cancelPOST } from '@/app/api/subscription/cancel/route'

beforeEach(() => {
  resetPrisma()
  auth.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
  cancelSubscription.mockResolvedValue(undefined)
  cancelStripeSubscription.mockResolvedValue(undefined)
})

describe('取消订阅', () => {
  it('未登录 → 401', async () => {
    auth.mockResolvedValue(null)
    const res = await cancelPOST()
    expect(res.status).toBe(401)
  })
  it('demo 用户 → 403', async () => {
    auth.mockResolvedValue({ user: { id: 'demo-user-id' } })
    const res = await cancelPOST()
    expect(res.status).toBe(403)
  })
  it('FREE 用户 → 400', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', creemSubscriptionId: null, stripeSubscriptionId: null })
    const res = await cancelPOST()
    expect(res.status).toBe(400)
  })
  it('Creem 订阅用户取消：调用 cancelSubscription 并清空 creemSubscriptionId（保留 PRO 到到期）', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', creemSubscriptionId: 'creem_sub_1', stripeSubscriptionId: null, subscriptionExpiryDate: new Date(Date.now() + 86400000) })
    const res = await cancelPOST()
    expect(res.status).toBe(200)
    expect(cancelSubscription).toHaveBeenCalledWith('creem_sub_1')
    expect(stores.users.get('u1').creemSubscriptionId).toBeNull()
    expect(stores.users.get('u1').subscriptionTier).toBe('PRO')
  })
  it('Stripe 订阅用户取消：调用 cancelStripeSubscription（修复：原实现不处理 Stripe）', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', creemSubscriptionId: null, stripeSubscriptionId: 'stripe_sub_1', subscriptionExpiryDate: new Date(Date.now() + 86400000) })
    const res = await cancelPOST()
    expect(res.status).toBe(200)
    expect(cancelStripeSubscription).toHaveBeenCalledWith('stripe_sub_1')
    expect(stores.users.get('u1').stripeSubscriptionId).toBeNull()
  })
  it('同时有 Creem + Stripe：两者都取消并清空', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', creemSubscriptionId: 'creem_sub_1', stripeSubscriptionId: 'stripe_sub_1', subscriptionExpiryDate: new Date(Date.now() + 86400000) })
    await cancelPOST()
    expect(cancelSubscription).toHaveBeenCalledWith('creem_sub_1')
    expect(cancelStripeSubscription).toHaveBeenCalledWith('stripe_sub_1')
    expect(stores.users.get('u1').creemSubscriptionId).toBeNull()
    expect(stores.users.get('u1').stripeSubscriptionId).toBeNull()
  })
  it('取消 API 抛错 → 保留本地订阅ID（fail-closed：便于 webhook 到期降级 / 可重试取消）', async () => {
    cancelSubscription.mockRejectedValue(new Error('api down'))
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', creemSubscriptionId: 'creem_sub_1', stripeSubscriptionId: null })
    const res = await cancelPOST()
    expect(res.status).toBe(200)
    // 不上游取消成功时，本地订阅ID 保留：
    // 1) 等 Creem webhook（subscription.canceled/expired）仍能按 subscriptionId 解析到用户并降级；
    // 2) 提供方 API 恢复后可再次点「取消」重试。
    expect(stores.users.get('u1').creemSubscriptionId).toBe('creem_sub_1')
  })

  it('取消 API 抛错 → 写入 failed 审计日志（便于对账脚本发现并去 Creem 后台补刀）', async () => {
    cancelSubscription.mockRejectedValue(new Error('api down'))
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', creemSubscriptionId: 'creem_sub_1', stripeSubscriptionId: null })
    await cancelPOST()

    const failed = Array.from(stores.logs.values()).find(
      (l: any) => l.source === 'cancel' && l.eventType === 'creem' && l.status === 'failed',
    )
    expect(failed).toBeDefined()
    const raw = JSON.parse(failed!.rawBody)
    expect(raw.userId).toBe('u1')
    expect(raw.subscriptionId).toBe('creem_sub_1')
    expect(raw.error).toContain('api down')
    // 同一次失败不应误写 completed 记录
    const completed = Array.from(stores.logs.values()).find(
      (l: any) => l.source === 'cancel' && l.status === 'completed',
    )
    expect(completed).toBeUndefined()
  })

  it('取消成功 → 写入 completed 审计日志（闭环）', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', creemSubscriptionId: 'creem_sub_1', stripeSubscriptionId: null })
    await cancelPOST()

    const completed = Array.from(stores.logs.values()).find(
      (l: any) => l.source === 'cancel' && l.eventType === 'creem' && l.status === 'completed',
    )
    expect(completed).toBeDefined()
    const raw = JSON.parse(completed!.rawBody)
    expect(raw.userId).toBe('u1')
    expect(raw.subscriptionId).toBe('creem_sub_1')
  })

  // P0 加固：「PRO + 无任何渠道订阅ID」误返 200 → 返回 409 明确告知
  // 场景：支付宝一次性付款 / webhook 失败遗留 / 两个渠道都错过回调
  it('PRO 用户但无 creem/stripe 订阅ID（遗留状态） → 409，提示无需取消', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', creemSubscriptionId: null, stripeSubscriptionId: null, subscriptionExpiryDate: new Date(Date.now() + 86400000) })
    // 用 before/after 计数：之前其他测试调用过 mock，但本次不应新增任何调用
    const beforeCreem = cancelSubscription.mock.calls.length
    const beforeStripe = cancelStripeSubscription.mock.calls.length
    const res = await cancelPOST()
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/无需取消|PRO 将在到期后自动失效/)
    // 不应调用任何上游取消 API
    expect(cancelSubscription.mock.calls.length).toBe(beforeCreem)
    expect(cancelStripeSubscription.mock.calls.length).toBe(beforeStripe)
  })
})
