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
// 严格按 Creem 官方 checkout.completed payload 构造：order.status = "paid"（F2 升级依据）
const nestedObj = (overrides: any = {}) => ({
  id: 'ord_1',
  metadata: { userId: 'u1', period: 'annual' },
  order: { id: 'ord_1', status: 'paid' },
  subscription: { object: 'subscription', id: 'creem_sub_1' },
  ...overrides,
})

const mkCreem = (eventType: string, obj: any, id = `evt_${Math.random().toString(36).slice(2)}`) => ({ eventType, id, object: obj })

beforeEach(() => {
  resetPrisma()
  verifyWebhook.mockReturnValue(true)
  stores.users.set('u1', {
    id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null,
    creemSubscriptionId: null,
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
  it('subscription.paid → 授予 PRO（从 now 累加 1 个月，首次购买）', async () => {
    await POST(creemReq(mkCreem('subscription.paid', subObj(), 'e1')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('PRO')
    expect(u.creemSubscriptionId).toBe('creem_sub_1')
    // 首次购买：到期日 = now + 1 月（不再用 Creem 的 current_period_end_date）
    const expected = new Date()
    expected.setUTCMonth(expected.getUTCMonth() + 1)
    expect(u.subscriptionExpiryDate?.getUTCMonth()).toBe(expected.getUTCMonth())
    expect(u.subscriptionExpiryDate?.getUTCFullYear()).toBe(expected.getUTCFullYear())
  })
  it('subscription.paid 解析不到用户 → 500（fail-closed，等重试）', async () => {
    // 有订阅ID但没有可解析的 userId
    const res = await POST(creemReq(mkCreem('subscription.paid', subObj({ metadata: {} }), 'e_un')))
    expect(res.status).toBe(500)
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
  })
  it('checkout.completed → 记录订单并同步订阅ID + 升级兜底', async () => {
    // 真实流程：create-checkout 先创建本地 PENDING 订单（orderId=CKCRxxx，externalCheckoutId=Creem ch_xxx），
    // webhook 随后到达携带 Creem 的 ch_xxx；recordOrder 按 externalCheckoutId 精确匹配本地订单并更新为 PAID
    // F2：checkout.completed 现在也升级（不再依赖 subscription.paid 必须到达）
    stores.orders.set('CKCRlocal', { id: 'CKCRlocal', orderId: 'CKCRlocal', externalCheckoutId: 'ord_1', userId: 'u1', channel: 'creem', amount: 2000, status: 'PENDING' })
    await POST(creemReq(mkCreem('checkout.completed', nestedObj(), 'e_co')))
    expect(stores.users.get('u1').subscriptionTier).toBe('PRO')
    expect(stores.users.get('u1').creemSubscriptionId).toBe('creem_sub_1')
    expect(stores.orders.get('CKCRlocal').status).toBe('PAID')
  })
  it('checkout.completed 用户已是 PRO → 续费累加到期日', async () => {
    // 已 PRO（到期日 2099-01-01），再来一次 checkout.completed（周期 annual）
    // 新到期日 = 2099-01-01 + 1年 = 2100-01-01，应该更新
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'PRO', subscriptionExpiryDate: new Date('2099-01-01T00:00:00Z'), creemSubscriptionId: null })
    await POST(creemReq(mkCreem('checkout.completed', nestedObj(), 'e_co2')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('PRO')
    // 续费累加：到期日从 2099 + 1年 = 2100
    expect(u.subscriptionExpiryDate?.getUTCFullYear()).toBe(2100)
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
    expect(u.subscriptionExpiryDate).not.toBeNull()
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

describe('Creem webhook — P0 加固', () => {
  // DoS 防护：rawBody > 64KB 必须在验签前直接拒绝，不能写库
  it('超大 body（>64KB）→ 413 且不写 webhookLog（验签前拒绝）', async () => {
    const huge = 'x'.repeat(70 * 1024)
    const body = { eventType: 'subscription.paid', id: 'evt_huge', object: subObj(), raw: huge }
    const before = stores.logs.size
    const res = await POST(creemReq(body, 'sig'))
    expect(res.status).toBe(413)
    // 即使签名合法也不能入审计表（防止大 body 撑爆 DB）
    expect(stores.logs.size).toBe(before)
  })

  // 签名失败：可以写一条"failed:signature"审计，但 rawBody 必须为 undefined（防敏感 payload 入库）
  it('签名失败 → 401 且 webhookLog.rawBody 为 undefined（不存原始 payload）', async () => {
    verifyWebhook.mockReturnValue(false)
    const res = await POST(creemReq(mkCreem('subscription.paid', subObj(), 'e_bad'), 'bad'))
    expect(res.status).toBe(401)
    const failed = Array.from(stores.logs.values()).find((l: any) => l.status === 'failed:signature')
    expect(failed).toBeDefined()
    expect(failed.rawBody).toBeUndefined()
  })

  // 验签通过后写入 webhookLog，处理后同一行状态从 received → processed（一行，非两行）
  it('签名通过 → webhookLog 存在单条记录，处理后状态为 processed', async () => {
    await POST(creemReq(mkCreem('subscription.paid', subObj(), 'e1')))
    const entry = Array.from(stores.logs.values()).find((l: any) => l.eventId === 'e1')
    expect(entry).toBeDefined()
    expect(entry.status).toBe('processed')
    // 同一个 eventId 只保留一行（received → processed 原地更新）
    const sameEvent = Array.from(stores.logs.values()).filter((l: any) => l.eventId === 'e1')
    expect(sameEvent.length).toBe(1)
  })

  // recordOrder：本地没有 PENDING 订单时不要回退创建新订单（防「一次付款产生两条订单」）
  it('checkout.completed 无本地 PENDING → 不创建新订单（但升级兜底仍生效）', async () => {
    // 故意不在 stores.orders 中种任何 PENDING 订单（极端 race：webhook 先到 / create-checkout 后到）
    expect(stores.orders.size).toBe(0)
    const res = await POST(creemReq(mkCreem('checkout.completed', nestedObj({ id: 'ch_xxx' }), 'e_co')))
    expect(res.status).toBe(200)
    // 不应新建任何 order（之前 buggy 版本会创建 orderId=ch_xxx 的脏数据）
    expect(stores.orders.size).toBe(0)
    // 订阅ID 同步仍然发生（syncSubscription 不依赖订单）
    expect(stores.users.get('u1').creemSubscriptionId).toBe('creem_sub_1')
    // F2：即使没有本地订单，订单已支付（order.status=paid）且用户是 FREE → 升级兜底生效
    expect(stores.users.get('u1').subscriptionTier).toBe('PRO')
  })

  // grantAccess 用户不存在 → 500 + failed 审计（防 metadata.userId 篡改攻击）
  it('subscription.paid metadata.userId 指向不存在的用户 → 500 + failed:user-not-found 审计', async () => {
    const res = await POST(creemReq(mkCreem('subscription.paid', subObj({ metadata: { userId: 'ghost_user' } }), 'e_ghost')))
    expect(res.status).toBe(500)
    const failed = Array.from(stores.logs.values()).find((l: any) => l.status === 'failed:user-not-found')
    expect(failed).toBeDefined()
    expect(failed.eventType).toBe('subscription.paid')
    // 用户状态未被篡改
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
  })
})

// ── 续费累加测试 ──
describe('Creem webhook — 续费累加', () => {
  it('subscription.paid 首次购买 monthly → 到期日 = now + 1月', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null })
    await POST(creemReq(mkCreem('subscription.paid', subObj({ metadata: { userId: 'u1', period: 'monthly' } }), 'e_first_m')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('PRO')
    const expected = new Date()
    expected.setUTCMonth(expected.getUTCMonth() + 1)
    expect(u.subscriptionExpiryDate?.getUTCMonth()).toBe(expected.getUTCMonth())
    expect(u.subscriptionExpiryDate?.getUTCFullYear()).toBe(expected.getUTCFullYear())
  })

  it('subscription.paid 首次购买 annual → 到期日 = now + 1年', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null })
    await POST(creemReq(mkCreem('subscription.paid', subObj({ metadata: { userId: 'u1', period: 'annual' } }), 'e_first_y')))
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('PRO')
    const expected = new Date()
    expected.setUTCFullYear(expected.getUTCFullYear() + 1)
    expect(u.subscriptionExpiryDate?.getUTCFullYear()).toBe(expected.getUTCFullYear())
  })

  it('subscription.paid 续费 monthly → 到期日在现有到期日 + 1月（不从 now 算）', async () => {
    // 用户已有 PRO，到期日 = 未来某天
    const existingExpiry = new Date()
    existingExpiry.setUTCMonth(existingExpiry.getUTCMonth() + 3) // 3个月后到期
    stores.users.set('u1', {
      id: 'u1',
      subscriptionTier: 'PRO',
      subscriptionExpiryDate: existingExpiry,
      creemSubscriptionId: 'creem_sub_1',
    })
    await POST(creemReq(mkCreem('subscription.paid', subObj({ metadata: { userId: 'u1', period: 'monthly' } }), 'e_renew_m')))
    const u = stores.users.get('u1')
    // 新到期日 = 现有到期日 + 1月 = 4个月后（不是 now + 1月 = 1个月后）
    const expected = new Date(existingExpiry)
    expected.setUTCMonth(expected.getUTCMonth() + 1)
    expect(u.subscriptionExpiryDate?.getUTCMonth()).toBe(expected.getUTCMonth())
    expect(u.subscriptionExpiryDate?.getUTCFullYear()).toBe(expected.getUTCFullYear())
  })

  it('subscription.paid 续费 annual → 到期日在现有到期日 + 1年', async () => {
    const existingExpiry = new Date()
    existingExpiry.setUTCMonth(existingExpiry.getUTCMonth() + 3) // 3个月后到期
    stores.users.set('u1', {
      id: 'u1',
      subscriptionTier: 'PRO',
      subscriptionExpiryDate: existingExpiry,
      creemSubscriptionId: 'creem_sub_1',
    })
    await POST(creemReq(mkCreem('subscription.paid', subObj({ metadata: { userId: 'u1', period: 'annual' } }), 'e_renew_y')))
    const u = stores.users.get('u1')
    // 新到期日 = 现有到期日 + 1年
    const expected = new Date(existingExpiry)
    expected.setUTCFullYear(expected.getUTCFullYear() + 1)
    expect(u.subscriptionExpiryDate?.getUTCFullYear()).toBe(expected.getUTCFullYear())
    expect(u.subscriptionExpiryDate?.getUTCMonth()).toBe(expected.getUTCMonth())
  })

  it('相同 eventId 重复投递续费 → 不重复累加（幂等保护）', async () => {
    const existingExpiry = new Date()
    existingExpiry.setUTCMonth(existingExpiry.getUTCMonth() + 3)
    stores.users.set('u1', {
      id: 'u1',
      subscriptionTier: 'PRO',
      subscriptionExpiryDate: existingExpiry,
      creemSubscriptionId: 'creem_sub_1',
    })
    const ev = mkCreem('subscription.paid', subObj({ metadata: { userId: 'u1', period: 'monthly' } }), 'evt_renew_dup')
    await POST(creemReq(ev, 's1'))
    const afterFirst = stores.users.get('u1').subscriptionExpiryDate
    // 重复投递同一事件
    const res = await POST(creemReq(ev, 's2'))
    expect(res.status).toBe(200)
    expect(stores.users.get('u1').subscriptionExpiryDate).toEqual(afterFirst) // 到期日不变
  })
})
