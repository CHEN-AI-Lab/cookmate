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
    const res = await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALmonth' }))
    expect(await res.text()).toBe('success')
    const u = stores.users.get('u1')
    expect(u.subscriptionTier).toBe('PRO')
    expect(stores.orders.get('CKALmonth').status).toBe('PAID')
    const expected = new Date(); expected.setUTCMonth(expected.getUTCMonth() + 1)
    expect(Math.abs(u.subscriptionExpiryDate.getTime() - expected.getTime())).toBeLessThan(2000)
  })
  it('年付成功 → 到期 +12 月（修复缺陷：原实现只 +1 月）', async () => {
    stores.users.set('u2', { id: 'u2', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    stores.orders.set('CKALyear', { id: 'CKALyear', orderId: 'CKALyear', userId: 'u2', channel: 'alipay', amount: 11900, status: 'PENDING' })
    await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALyear' }))
    const u = stores.users.get('u2')
    const expected = new Date(); expected.setUTCFullYear(expected.getUTCFullYear() + 1)
    expect(Math.abs(u.subscriptionExpiryDate.getTime() - expected.getTime())).toBeLessThan(2000)
  })
  it('重复通知幂等：第二次不重复延长', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    stores.orders.set('CKALm', { id: 'CKALm', orderId: 'CKALm', userId: 'u1', channel: 'alipay', amount: 2000, status: 'PENDING' })
    await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALm' }))
    const before = stores.users.get('u1').subscriptionExpiryDate
    await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALm' }))
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
    const future = new Date(now); future.setUTCMonth(future.getUTCMonth() + 3)
    stores.users.set('u3', { id: 'u3', subscriptionTier: 'PRO', subscriptionExpiryDate: future, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    stores.orders.set('CKALr', { id: 'CKALr', orderId: 'CKALr', userId: 'u3', channel: 'alipay', amount: 2000, status: 'PENDING' })
    await notifyPOST(makeFormNotify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CKALr' }))
    const expected = new Date(future); expected.setUTCMonth(expected.getUTCMonth() + 1)
    expect(Math.abs(stores.users.get('u3').subscriptionExpiryDate.getTime() - expected.getTime())).toBeLessThan(2000)
  })
})
