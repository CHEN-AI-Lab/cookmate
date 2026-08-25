// Creem webhook 端到端测试：11 个事件的授权/降级、签名、幂等（主支付渠道）
// 注意：事件结构严格按 Creem 官方 webhook 实际形态构造：
//   - subscription.* 事件：event.object = { object:"subscription", id, metadata, current_period_end_date, status }
//   - checkout.completed / refund.created：event.object = { id, metadata, subscription:{ id } }
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@cookmate/shared/api/creem', () => ({
  verifyWebhook: vi.fn(),
  isCreemConfigured: vi.fn(() => true),
  createCheckout: vi.fn(),
  retrieveCheckout: vi.fn(),
  cancelSubscription: vi.fn(),
}))
import { verifyWebhook } from '@cookmate/shared/api/creem'

import { POST } from '@/app/api/webhook/creem/route'

function creemReq(body: object, sig = 'sig') {
  return new Request('http://localhost/api/webhook/creem', {
    method: 'POST', headers: { 'content-type': 'application/json', 'creem-signature': sig }, body: JSON.stringify(body),
  })
}

// subscription.* 事件对象（Creem 真实结构）
const subObj = (overrides: any = {}) => ({
  object: 'subscription',
  id: 'creem_sub_1',
  metadata: { userId: 'u1' },
  current_period_end_date: '2099-01-01T00:00:00Z',
  status: 'active',
  ...overrides,
})
// checkout.completed / refund.created 事件对象（订阅嵌套在 subscription 字段）
const nestedObj = (overrides: any = {}) => ({
  id: 'ord_1',
  metadata: { userId: 'u1', period: 'annual' },
  subscription: { object: 'subscription', id: 'creem_sub_1' },
  ...overrides,
})

const mkCreem = (eventType: string, obj: any, id = `evt_${Math.random().toString(36).slice(2)}`) => ({ eventType, id, object: obj })

beforeEach(() => {
  resetPrisma()
  verifyWebhook.mockReturnValue(true)
  stores.users.set('u1', {
    id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null,
    creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null,
  })
})

describe('Creem webhook — 鉴权', () => {
  it('签名无效 → 401', async () => {
    verifyWebhook.mockReturnValue(false)
    const res = await POST(creemReq(mkCreem('subscription.paid', subObj(), 'e1')))
    expect(res.status).toBe(401)
  })
})

describe('Creem webhook — 授权事件', () => {
  it('subscription.paid → 授予 PRO（用官方 current_period_end_date）', async () => {
    await POST(creemReq(mkCreem('subscription.paid', subObj(), 'e1')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('PRO')
    expect(u.creemSubscriptionId).toBe('creem_sub_1')
    expect(u.subscriptionExpiryDate).toEqual(new Date('2099-01-01T00:00:00Z'))
  })
  it('subscription.paid 解析不到用户 → 500（fail-closed，等重试）', async () => {
    // 有订阅ID但没有可解析的 userId
    const res = await POST(creemReq(mkCreem('subscription.paid', subObj({ metadata: {} }), 'e_un')))
    expect(res.status).toBe(500)
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
  })
  it('checkout.completed → 记录订单并同步订阅ID，不升级', async () => {
    await POST(creemReq(mkCreem('checkout.completed', nestedObj(), 'e_co')))
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
    expect(stores.users.get('u1').creemSubscriptionId).toBe('creem_sub_1')
    expect(stores.orders.get('ord_1').status).toBe('PAID')
  })
  it('subscription.update active → 同步并授权', async () => {
    await POST(creemReq(mkCreem('subscription.update', subObj({ status: 'active' }), 'e1')))
    expect(stores.users.get('u1').subscriptionTier).toBe('PRO')
  })
})

describe('Creem webhook — 降级事件', () => {
  const paid = () => POST(creemReq(mkCreem('subscription.paid', subObj(), 'e_pay')))
  it('subscription.canceled → 清空订阅ID但保留 PRO+到期', async () => {
    await paid()
    await POST(creemReq(mkCreem('subscription.canceled', subObj(), 'e2')))
    const u = stores.users.get('u1')
    expect(u.creemSubscriptionId).toBeNull()
    expect(u.subscriptionTier).toBe('PRO')
    expect(u.subscriptionExpiryDate).toEqual(new Date('2099-01-01T00:00:00Z'))
  })
  it('subscription.expired → 降级 FREE', async () => {
    await paid()
    await POST(creemReq(mkCreem('subscription.expired', subObj(), 'e2')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('FREE')
    expect(u.subscriptionExpiryDate).toBeNull()
  })
  it('refund.created → 立即降级 FREE', async () => {
    await paid()
    await POST(creemReq(mkCreem('refund.created', subObj(), 'e2')))
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
  })
  it('subscription.paused → FREE 但保留订阅ID', async () => {
    await paid()
    await POST(creemReq(mkCreem('subscription.paused', subObj(), 'e2')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('FREE')
    expect(u.creemSubscriptionId).toBe('creem_sub_1')
  })
  it('subscription.past_due → FREE 保留订阅ID', async () => {
    await paid()
    await POST(creemReq(mkCreem('subscription.past_due', subObj(), 'e2')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('FREE')
    expect(u.creemSubscriptionId).toBe('creem_sub_1')
  })
  it('subscription.scheduled_cancel → 不操作（保持 PRO）', async () => {
    await paid()
    await POST(creemReq(mkCreem('subscription.scheduled_cancel', subObj(), 'e2')))
    expect(stores.users.get('u1').subscriptionTier).toBe('PRO')
  })
  it('subscription.trialing → 仅记录不授权', async () => {
    await POST(creemReq(mkCreem('subscription.trialing', subObj(), 'e1')))
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
  })
  it('未知事件 → 200 不报错', async () => {
    const res = await POST(creemReq(mkCreem('something.weird', {}, 'e1')))
    expect(res.status).toBe(200)
  })
})

describe('Creem webhook — 幂等', () => {
  it('相同 eventId 重复投递不重复升级', async () => {
    const ev = mkCreem('subscription.paid', subObj(), 'evt_dup')
    await POST(creemReq(ev, 's1'))
    const before = prismaMock.user.update.mock.calls.length
    const res = await POST(creemReq(ev, 's2'))
    expect(res.status).toBe(200)
    expect(prismaMock.user.update.mock.calls.length).toBe(before)
  })
})
