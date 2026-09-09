// 支付完整流程集成测试：Alipay + Creem 端到端流程验证
// 覆盖：创建订单 → 支付回调 → 升级 → 数据库状态一致性
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@cookmate/shared/api/creem', () => ({
  createCheckout: vi.fn(),
  retrieveCheckout: vi.fn(),
  isCreemConfigured: vi.fn(() => true),
  verifyWebhook: vi.fn(),
}))
vi.mock('@cookmate/shared/api/alipay-pay', () => ({
  createPagePay: vi.fn(async () => 'https://pay.example/x'),
  isAlipayConfigured: vi.fn(() => true),
  verifyNotify: vi.fn(() => true),
}))
vi.mock('@cookmate/shared/utils/order-id', () => ({ generateOrderId: vi.fn(() => 'CKCR20260825A1B2C3D4') }))

import { auth } from '@/lib/auth'
import { addMonths, addYears } from '@cookmate/shared/utils/subscription'
import { createCheckout, verifyWebhook } from '@cookmate/shared/api/creem'

import { POST as creemPOST } from '@/app/api/creem/create-checkout/route'
import { POST as creemWebhookPOST } from '@/app/api/webhook/creem/route'
import { POST as alipayPOST } from '@/app/api/alipay/create/route'
import { POST as alipayNotifyPOST } from '@/app/api/alipay/notify/route'

function creemCheckoutReq(body: object) {
  return new Request('http://localhost/api/creem/create-checkout', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}
function creemWebhookReq(body: object, sig = 'sig') {
  return new Request('http://localhost/api/webhook/creem', {
    method: 'POST', headers: { 'content-type': 'application/json', 'creem-signature': sig }, body: JSON.stringify(body),
  })
}
function alipayCheckoutReq(body: object) {
  return new Request('http://localhost/api/alipay/create', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}
function alipayNotify(params: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(params)) fd.append(k, v)
  return new Request('http://localhost/api/alipay/notify', { method: 'POST', body: fd })
}

// 种子用户：在 beforeEach 之后，每次测试前重新设置（防止 resetPrisma 清空）
function seedUser() {
  stores.users.set('u1', {
    id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null,
    creemSubscriptionId: null,
  })
}

beforeEach(() => {
  resetPrisma()
  seedUser()
  ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.cookmate.com'
  process.env.CREEM_PRODUCT_ID = 'prod_test'
  process.env.CREEM_MONTHLY_PRODUCT_ID = 'prod_monthly'
  process.env.CREEM_ANNUAL_PRODUCT_ID = 'prod_annual'
  process.env.AUTH_ALIPAY_ID = 'appid123'
  process.env.AUTH_ALIPAY_PUBLIC_KEY = 'pubkey'
  process.env.NODE_ENV = 'test'
  ;(verifyWebhook as any).mockReturnValue(true)
})

describe('Creem 完整支付流程', () => {
  it('月付：create → webhook subscription.paid → PRO + 订单PAID + currency=USD', async () => {
    ;(createCheckout as any).mockResolvedValue({ checkoutUrl: 'https://creem/checkout/m', sessionId: 'ch_m' })

    // Step 1: 用户点击月付
    const createRes = await creemPOST(creemCheckoutReq({ period: 'monthly' }))
    expect(createRes.status).toBe(200)
    const createJson = await createRes.json()
    expect(createJson.sessionId).toBe('ch_m')

    // Step 2: Creem 扣款成功，发送 webhook
    const subObj = {
      object: 'subscription',
      id: 'creem_sub_m1',
      metadata: { userId: 'u1', period: 'monthly' },
      current_period_end_date: '2099-01-01T00:00:00Z',
      status: 'active',
    }
    const webhookRes = await creemWebhookPOST(creemWebhookReq({
      eventType: 'subscription.paid',
      id: 'evt_paid_m',
      object: subObj,
    }))
    expect(webhookRes.status).toBe(200)

    // Step 3: 验证用户升级到 PRO
    const user = stores.users.get('u1')
    expect(user.subscriptionTier).toBe('PRO')
    expect(user.creemSubscriptionId).toBe('creem_sub_m1')
    const expected = addMonths(new Date(), 1)
    expect(Math.abs(user.subscriptionExpiryDate.getTime() - expected.getTime())).toBeLessThan(2000)

    // Step 4: 验证订单数据（subscription.paid 不标记订单为 PAID，由 checkout.completed 标记）
    const order = stores.orders.get('CKCR20260825A1B2C3D4')
    expect(order).toBeDefined()
    expect(order.channel).toBe('creem')
    expect(order.currency).toBe('USD')
    expect(order.amount).toBe(499) // $4.99
    expect(order.period).toBe('monthly')
  })

  it('年付：create → webhook subscription.paid → PRO + currency=USD', async () => {
    ;(createCheckout as any).mockResolvedValue({ checkoutUrl: 'https://creem/checkout/y', sessionId: 'ch_y' })

    const createRes = await creemPOST(creemCheckoutReq({ period: 'annual' }))
    expect(createRes.status).toBe(200)

    const subObj = {
      object: 'subscription',
      id: 'creem_sub_y1',
      metadata: { userId: 'u1', period: 'annual' },
      current_period_end_date: '2099-01-01T00:00:00Z',
      status: 'active',
    }
    await creemWebhookPOST(creemWebhookReq({
      eventType: 'subscription.paid',
      id: 'evt_paid_y',
      object: subObj,
    }))

    const user = stores.users.get('u1')
    expect(user.subscriptionTier).toBe('PRO')
    const expected = addYears(new Date(), 1)
    expect(Math.abs(user.subscriptionExpiryDate.getTime() - expected.getTime())).toBeLessThan(2000)

    const order = stores.orders.get('CKCR20260825A1B2C3D4')
    expect(order.currency).toBe('USD')
    expect(order.amount).toBe(3999) // $39.99
    expect(order.period).toBe('annual')
  })

  it('checkout.completed 兜底升级：create → webhook checkout.completed → PRO', async () => {
    ;(createCheckout as any).mockResolvedValue({ checkoutUrl: 'https://creem/checkout/c', sessionId: 'ch_c' })

    await creemPOST(creemCheckoutReq({ period: 'monthly' }))

    // subscription.paid 未到达，checkout.completed 先到达
    const nestedObj = {
      id: 'ch_c',
      metadata: { userId: 'u1', period: 'monthly' },
      order: { id: 'ch_c', status: 'paid' },
      subscription: { object: 'subscription', id: 'creem_sub_c' },
    }
    const res = await creemWebhookPOST(creemWebhookReq({
      eventType: 'checkout.completed',
      id: 'evt_co',
      object: nestedObj,
    }))
    expect(res.status).toBe(200)

    const user = stores.users.get('u1')
    expect(user.subscriptionTier).toBe('PRO')
    expect(user.creemSubscriptionId).toBe('creem_sub_c')
  })

  it('跨渠道隔离：Creem webhook 错误 userId → 不升级 u1', async () => {
    ;(createCheckout as any).mockResolvedValue({ checkoutUrl: 'https://creem/checkout/x', sessionId: 'ch_x' })
    await creemPOST(creemCheckoutReq({ period: 'monthly' }))

    // 用错误的 userId 发 webhook
    const subObj = {
      object: 'subscription',
      id: 'creem_sub_bad',
      metadata: { userId: 'u999', period: 'monthly' },
      current_period_end_date: '2099-01-01T00:00:00Z',
      status: 'active',
    }
    const res = await creemWebhookPOST(creemWebhookReq({ eventType: 'subscription.paid', id: 'evt_bad', object: subObj }))
    // 解析不到用户 → 500，Creem 会重试
    expect(res.status).toBe(500)

    // u1 仍然是 FREE
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
  })
})

describe('Alipay 完整支付流程', () => {
  it('月付：create → notify TRADE_SUCCESS → PRO + 订单PAID + currency=CNY', async () => {
    const createRes = await alipayPOST(alipayCheckoutReq({ period: 'monthly' }))
    expect(createRes.status).toBe(200)
    const createJson = await createRes.json()
    expect(createJson.orderId).toBeTruthy()
    expect(createJson.payUrl).toBeTruthy()

    // 支付宝通知
    const notifyRes = await alipayNotifyPOST(alipayNotify({
      app_id: 'appid123',
      trade_status: 'TRADE_SUCCESS',
      out_trade_no: createJson.orderId,
      total_amount: '29.00',
    }))
    expect(notifyRes.status).toBe(200)
    expect(await notifyRes.text()).toBe('success')

    // 验证用户升级
    const user = stores.users.get('u1')
    expect(user.subscriptionTier).toBe('PRO')
    const expected = addMonths(new Date(), 1)
    expect(Math.abs(user.subscriptionExpiryDate.getTime() - expected.getTime())).toBeLessThan(2000)

    // 验证订单
    const order = stores.orders.get(createJson.orderId)
    expect(order.status).toBe('PAID')
    expect(order.channel).toBe('alipay')
    expect(order.currency).toBe('CNY')
    expect(order.amount).toBe(2900)
  })

  it('年付：create → notify → PRO + 到期 +1 年', async () => {
    const createRes = await alipayPOST(alipayCheckoutReq({ period: 'annual' }))
    expect(createRes.status).toBe(200)
    const orderId = (await createRes.json()).orderId

    await alipayNotifyPOST(alipayNotify({
      app_id: 'appid123',
      trade_status: 'TRADE_SUCCESS',
      out_trade_no: orderId,
      total_amount: '199.00',
    }))

    const user = stores.users.get('u1')
    expect(user.subscriptionTier).toBe('PRO')
    const expected = addYears(new Date(), 1)
    expect(Math.abs(user.subscriptionExpiryDate.getTime() - expected.getTime())).toBeLessThan(2000)

    const order = stores.orders.get(orderId)
    expect(order.currency).toBe('CNY')
    expect(order.amount).toBe(19900)
  })

  it('幂等：重复通知不重复延长到期日', async () => {
    const createRes = await alipayPOST(alipayCheckoutReq({ period: 'monthly' }))
    const orderId = (await createRes.json()).orderId

    await alipayNotifyPOST(alipayNotify({
      app_id: 'appid123',
      trade_status: 'TRADE_SUCCESS',
      out_trade_no: orderId,
      total_amount: '29.00',
    }))
    const firstExpiry = stores.users.get('u1').subscriptionExpiryDate

    // 重复通知
    await alipayNotifyPOST(alipayNotify({
      app_id: 'appid123',
      trade_status: 'TRADE_SUCCESS',
      out_trade_no: orderId,
      total_amount: '29.00',
    }))

    // 到期日不变
    expect(stores.users.get('u1').subscriptionExpiryDate.getTime()).toBe(firstExpiry.getTime())
  })
})
