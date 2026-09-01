// 支付宝支付测试：创建订单（月/年）+ 异步通知（签名/幂等/到期日，含年付修复）
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
import { auth } from '@/lib/auth'
vi.mock('@cookmate/shared/api/alipay-pay', () => ({
  createPagePay: vi.fn(async () => 'https://pay.example/x'),
  isAlipayConfigured: vi.fn(() => true),
  verifyNotify: vi.fn(),
}))
import { createPagePay, isAlipayConfigured, verifyNotify } from '@cookmate/shared/api/alipay-pay'
// 期望值必须用业务同款 addMonths/addYears（带月末钳制）。
// 若用裸 setUTCMonth/setUTCFullYear，JS 会溢出（1/31 +1月 → 3/3），而业务钳制为 2/28，
// 导致一年中有 52/1096 天（1/29、1/30、1/31 及各月 31 号、闰年 2/29）测试误报失败。
import { addMonths, addYears } from '@cookmate/shared/utils/subscription'

import { POST as createPOST } from '@/app/api/alipay/create/route'
import { POST as notifyPOST } from '@/app/api/alipay/notify/route'

function makeJsonReq(body: object) {
  return new Request('http://localhost/api/alipay/create', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}
function makeFormNotify(params: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(params)) fd.append(k, v)
  return new Request('http://localhost/api/alipay/notify', { method: 'POST', body: fd })
}

beforeEach(() => {
  resetPrisma()
  auth.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
  isAlipayConfigured.mockReturnValue(true)
  createPagePay.mockResolvedValue('https://pay.example/x')
  verifyNotify.mockReturnValue(true)
  process.env.AUTH_ALIPAY_ID = 'appid123'
  process.env.AUTH_ALIPAY_PUBLIC_KEY = 'pubkey'
  process.env.NODE_ENV = 'test'
})

describe('支付宝创建订单', () => {
  it('未登录 → 401', async () => {
    auth.mockResolvedValue(null)
    const res = await createPOST(makeJsonReq({ period: 'monthly' }))
    expect(res.status).toBe(401)
  })
  it('demo 用户 → 403', async () => {
    auth.mockResolvedValue({ user: { id: 'demo-user-id' } })
    const res = await createPOST(makeJsonReq({ period: 'monthly' }))
    expect(res.status).toBe(403)
  })
  it('未配置 → 503', async () => {
    isAlipayConfigured.mockReturnValue(false)
    const res = await createPOST(makeJsonReq({ period: 'monthly' }))
    expect(res.status).toBe(503)
  })
  it('monthly → 成功，订单金额 2000 分', async () => {
    const res = await createPOST(makeJsonReq({ period: 'monthly' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.payUrl).toBeTruthy()
    expect(prismaMock.paymentOrder.create.mock.calls[0][0].data.amount).toBe(2000)
    expect(prismaMock.paymentOrder.create.mock.calls[0][0].data.channel).toBe('alipay')
    expect(prismaMock.paymentOrder.create.mock.calls[0][0].data.status).toBe('PENDING')
  })
  it('annual → 成功，订单金额 11900 分', async () => {
    const res = await createPOST(makeJsonReq({ period: 'annual' }))
    expect(res.status).toBe(200)
    expect(prismaMock.paymentOrder.create.mock.calls[0][0].data.amount).toBe(11900)
  })
})

describe('支付宝异步通知', () => {
  it('app_id 不匹配 → 400 failure', async () => {
    const res = await notifyPOST(makeFormNotify({ app_id: 'wrong', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKAL1' }))
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('failure')
  })
  it('公钥未配置 → 拒绝（fail-closed），不升级', async () => {
    delete process.env.AUTH_ALIPAY_PUBLIC_KEY
    const res = await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKAL1' }))
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('failure')
  })
  it('签名验证失败 → 400 failure', async () => {
    verifyNotify.mockReturnValue(false)
    const res = await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKAL1' }))
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('failure')
  })
  it('月付成功 → 幂等升级，到期 +1 月', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    stores.orders.set('CKALmonth', { id: 'CKALmonth', orderId: 'CKALmonth', userId: 'u1', channel: 'alipay', amount: 2000, status: 'PENDING' })
    const res = await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALmonth', total_amount: '20.00' }))
    expect(await res.text()).toBe('success')
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('PRO')
    expect(stores.orders.get('CKALmonth').status).toBe('PAID')
    const expected = addMonths(new Date(), 1)
    expect(Math.abs(u.subscriptionExpiryDate.getTime() - expected.getTime())).toBeLessThan(2000)
  })
  it('年付成功 → 到期 +12 月（修复缺陷：原实现只 +1 月）', async () => {
    stores.users.set('u2', { id: 'u2', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    stores.orders.set('CKALyear', { id: 'CKALyear', orderId: 'CKALyear', userId: 'u2', channel: 'alipay', amount: 11900, status: 'PENDING' })
    await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALyear', total_amount: '119.00' }))
    const u = stores.users.get('u2')
    const expected = addYears(new Date(), 1)
    expect(Math.abs(u.subscriptionExpiryDate.getTime() - expected.getTime())).toBeLessThan(2000)
  })
  it('重复通知幂等：第二次不重复延长', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    stores.orders.set('CKALm', { id: 'CKALm', orderId: 'CKALm', userId: 'u1', channel: 'alipay', amount: 2000, status: 'PENDING' })
    await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALm', total_amount: '20.00' }))
    const before = stores.users.get('u1').subscriptionExpiryDate
    await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALm', total_amount: '20.00' }))
    expect(stores.users.get('u1').subscriptionExpiryDate).toEqual(before)
  })
  it('非成功状态（WAIT_BUYER_PAY）→ 不升级', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    stores.orders.set('CKALw', { id: 'CKALw', orderId: 'CKALw', userId: 'u1', channel: 'alipay', amount: 2000, status: 'PENDING' })
    await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'WAIT_BUYER_PAY', out_trade_no: 'CKALw' }))
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
  })
  it('续费累加：已 PRO 且未到期，+1 月从现有到期日起算', async () => {
    const now = new Date()
    const future = addMonths(now, 3)
    stores.users.set('u3', { id: 'u3', subscriptionTier: 'PRO', subscriptionExpiryDate: future, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    stores.orders.set('CKALr', { id: 'CKALr', orderId: 'CKALr', userId: 'u3', channel: 'alipay', amount: 2000, status: 'PENDING' })
    await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALr', total_amount: '20.00' }))
    const expected = addMonths(future, 1)
    expect(Math.abs(stores.users.get('u3').subscriptionExpiryDate.getTime() - expected.getTime())).toBeLessThan(2000)
  })

  // P0 加固：金额校验 — 防止优惠/汇率/调价场景下「实付 ≠ 应付」但仍升 PRO
  it('total_amount 与本地订单金额不一致 → 400 failure 且不升级', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    // 订单金额 2000 分（¥20.00），但回调 total_amount = 19.99（少 0.01）
    stores.orders.set('CKALamt', { id: 'CKALamt', orderId: 'CKALamt', userId: 'u1', channel: 'alipay', amount: 2000, status: 'PENDING' })
    const res = await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALamt', total_amount: '19.99' }))
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('failure')
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
    expect(stores.orders.get('CKALamt').status).toBe('PENDING')
  })

  // P0 加固：金额匹配失败 fail-closed（运营调价 / 老订单 / 优惠码场景）
  it('订单金额不在四套餐内（运营调价） → 400 failure，不静默回退到 1 月', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    // 订单金额 3000 分（¥30），不在任何套餐内
    stores.orders.set('CKALweird', { id: 'CKALweird', orderId: 'CKALweird', userId: 'u1', channel: 'alipay', amount: 3000, status: 'PENDING' })
    const res = await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALweird', total_amount: '30.00' }))
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('failure')
    // 关键：不升级、不延长到期日（不再静默回退到 1 月）
    expect(stores.users.get('u1').subscriptionTier).toBe('FREE')
    expect(stores.users.get('u1').subscriptionExpiryDate).toBeNull()
  })

  // 加固：Alipay notify 必须写 WebhookLog 审计（与 Creem/Stripe 一致）
  it('Alipay notify 处理成功 → WebhookLog 写入 received + processed', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    stores.orders.set('CKALaudit', { id: 'CKALaudit', orderId: 'CKALaudit', userId: 'u1', channel: 'alipay', amount: 2000, status: 'PENDING' })
    await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALaudit', total_amount: '20.00' }))
    const logs = Array.from(stores.logs.values()).filter((l: any) => l.source === 'alipay')
    const received = logs.find((l: any) => l.status === 'received')
    const processed = logs.find((l: any) => l.status === 'processed')
    expect(received).toBeDefined()
    expect(received.eventType).toBe('TRADE_SUCCESS')
    expect(processed).toBeDefined()
  })

  it('Alipay notify app_id 不匹配 → WebhookLog 写 failed:appid', async () => {
    await notifyPOST(makeFormNotify({ app_id: 'wrong_app_id', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKAL1' }))
    const failed = Array.from(stores.logs.values()).find((l: any) => l.source === 'alipay' && l.status === 'failed:appid')
    expect(failed).toBeDefined()
    // 关键：原始参数必须落库（用于事后审计 / 对账）
    expect(failed.rawBody).toBeDefined()
    const params = JSON.parse(failed.rawBody)
    expect(params.app_id).toBe('wrong_app_id')
  })
})
