// Stripe webhook 端到端测试：鉴权、幂等、订阅授权/降级（零缺陷核心）
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})

const mockStripe = {
  webhooks: { constructEvent: vi.fn() },
  subscriptions: { cancel: vi.fn() },
}
vi.mock('@cookmate/shared/api/stripe', () => ({
  getStripe: () => mockStripe,
  cancelStripeSubscription: (id: string) => mockStripe.subscriptions.cancel(id),
}))

import { POST } from '@/app/api/webhook/stripe/route'

function makeReq(body: object, signature = 'sig') {
  return new Request('http://localhost/api/webhook/stripe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'stripe-signature': signature },
    body: JSON.stringify(body),
  })
}
const mkEvent = (type: string, obj: any, id = `evt_${Math.random().toString(36).slice(2)}`) => ({
  id,
  type,
  data: { object: obj },
})

beforeEach(() => {
  resetPrisma()
  stores.users.set('u1', {
    id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null,
    creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null,
  })
  mockStripe.webhooks.constructEvent.mockImplementation((raw: string) => JSON.parse(raw))
  mockStripe.subscriptions.cancel.mockResolvedValue({ id: 'sub_x', status: 'canceled' })
  process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  process.env.NODE_ENV = 'test'
})

describe('Stripe webhook — 鉴权', () => {
  it('未配置 STRIPE_SECRET_KEY → 503', async () => {
    delete process.env.STRIPE_SECRET_KEY
    const res = await POST(makeReq(mkEvent('customer.subscription.updated', { id: 'sub_1', status: 'active', current_period_end: 9999999999 })))
    expect(res.status).toBe(503)
  })

  it('签名验证失败（constructEvent 抛错）→ 400', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => { throw new Error('bad sig') })
    const res = await POST(makeReq(mkEvent('customer.subscription.updated', { id: 'sub_1', status: 'active', current_period_end: 9999999999 })))
    expect(res.status).toBe(400)
  })
})

describe('Stripe webhook — 订阅授权（写入到期日，修复零缺陷）', () => {
  it('subscription.updated active → 写入 PRO + 到期日（来自 current_period_end）', async () => {
    await POST(makeReq(mkEvent('customer.subscription.updated', { id: 'sub_1', status: 'active', current_period_end: 9999999999, metadata: { userId: 'u1' } }, 'evt_a')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('PRO')
    expect(u.subscriptionExpiryDate).toEqual(new Date(9999999999 * 1000))
    expect(u.stripeSubscriptionId).toBe('sub_1')
  })

  it('subscription.created active → 同样授权', async () => {
    await POST(makeReq(mkEvent('customer.subscription.created', { id: 'sub_1', status: 'active', current_period_end: 9999999999, metadata: { userId: 'u1' } }, 'evt_a')))
    expect(stores.users.get('u1').subscriptionTier).toBe('PRO')
  })

  it('trialing 状态也授权 PRO', async () => {
    await POST(makeReq(mkEvent('customer.subscription.updated', { id: 'sub_1', status: 'trialing', current_period_end: 9999999999, metadata: { userId: 'u1' } }, 'evt_a')))
    expect(stores.users.get('u1').subscriptionTier).toBe('PRO')
  })

  it('active 但缺少 current_period_end → 500（fail-closed，不授予）', async () => {
    const res = await POST(makeReq(mkEvent('customer.subscription.updated', { id: 'sub_1', status: 'active', metadata: { userId: 'u1' } }, 'evt_y')))
    expect(res.status).toBe(500)
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
  })

  it('解析不到用户 → 500（fail-closed，等待重试）', async () => {
    const res = await POST(makeReq(mkEvent('customer.subscription.updated', { id: 'sub_x', status: 'active', current_period_end: 9999999999, metadata: {} }, 'evt_x')))
    expect(res.status).toBe(500)
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
  })

  it('通过 stripeCustomerId（无 metadata.userId）也能解析并授权', async () => {
    stores.users.set('u2', { id: 'u2', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: 'cus_2', stripeSubscriptionId: null })
    await POST(makeReq(mkEvent('customer.subscription.updated', { id: 'sub_2', status: 'active', current_period_end: 9999999999, customer: 'cus_2' }, 'evt_c')))
    expect(stores.users.get('u2').subscriptionTier).toBe('PRO')
  })
})

describe('Stripe webhook — 降级边界', () => {
  const periodEnd = { id: 'sub_1', status: 'active', current_period_end: 9999999999, metadata: { userId: 'u1' } }
  it('subscription.updated canceled → 降级 FREE 并清空订阅ID', async () => {
    await POST(makeReq(mkEvent('customer.subscription.updated', periodEnd, 'e1')))
    await POST(makeReq(mkEvent('customer.subscription.updated', { id: 'sub_1', status: 'canceled', current_period_end: 9999999999, metadata: { userId: 'u1' } }, 'e2')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('FREE')
    expect(u.subscriptionExpiryDate).toBeNull()
    expect(u.stripeSubscriptionId).toBeNull()
  })

  it('subscription.updated past_due → 降级 FREE 但保留订阅ID（便于重试恢复）', async () => {
    await POST(makeReq(mkEvent('customer.subscription.updated', periodEnd, 'e1')))
    await POST(makeReq(mkEvent('customer.subscription.updated', { id: 'sub_1', status: 'past_due', current_period_end: 9999999999, metadata: { userId: 'u1' } }, 'e2')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('FREE')
    expect(u.stripeSubscriptionId).toBe('sub_1')
  })

  it('subscription.deleted → 降级 FREE 并清空订阅ID', async () => {
    await POST(makeReq(mkEvent('customer.subscription.created', periodEnd, 'e1')))
    await POST(makeReq(mkEvent('customer.subscription.deleted', { id: 'sub_1', customer: 'cus_1', metadata: { userId: 'u1' } }, 'e_del')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('FREE')
    expect(u.stripeSubscriptionId).toBeNull()
  })
})

describe('Stripe webhook — 幂等 & 订单', () => {
  it('重复事件（相同 eventId）幂等：第二次不重复写库', async () => {
    const ev = mkEvent('customer.subscription.updated', { id: 'sub_1', status: 'active', current_period_end: 9999999999, metadata: { userId: 'u1' } }, 'evt_dup')
    await POST(makeReq(ev, 's1'))
    const before = prismaMock.user.update.mock.calls.length
    const res = await POST(makeReq(ev, 's2'))
    expect(res.status).toBe(200)
    expect(prismaMock.user.update.mock.calls.length).toBe(before)
  })

  it('checkout.session.completed 记录订单并同步订阅ID，但不直接升级', async () => {
    const res = await POST(makeReq({ id: 'evt_co', type: 'checkout.session.completed', data: { object: { id: 'cs_1', metadata: { userId: 'u1' }, subscription: 'sub_1', customer: 'cus_1', amount_total: 2000 } } }))
    expect(res.status).toBe(200)
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('FREE') // 未升级
    expect(u.stripeSubscriptionId).toBe('sub_1')
    expect(u.stripeCustomerId).toBe('cus_1')
    expect(stores.orders.get('stripe_evt_co')?.status).toBe('PAID')
  })

  it('未知事件 → 200 且记录，不抛错', async () => {
    const res = await POST(makeReq(mkEvent('some.unknown.event', {}, 'evt_unk')))
    expect(res.status).toBe(200)
  })
})
