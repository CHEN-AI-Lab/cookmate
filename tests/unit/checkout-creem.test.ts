// creem/create-checkout 路由测试：POST 创建 + GET 轮询支付状态（升级/越权/未配置）
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
}))
vi.mock('@cookmate/shared/utils/order-id', () => ({ generateOrderId: vi.fn(() => 'CKCR20260825A1B2C3D4') }))

import { auth } from '@/lib/auth'
import { createCheckout, retrieveCheckout, isCreemConfigured } from '@cookmate/shared/api/creem'
import { POST, GET } from '@/app/api/creem/create-checkout/route'

function postReq(body: any) {
  return new Request('http://localhost/api/creem/create-checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
}
function getReq(url: string) {
  return new Request(url, { method: 'GET' })
}

beforeEach(() => {
  resetPrisma()
  ;(auth as any).mockResolvedValue({ user: { id: 'u1' } })
  ;(createCheckout as any).mockReset()
  ;(retrieveCheckout as any).mockReset()
  ;(isCreemConfigured as any).mockReturnValue(true)
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.cookmate.com'
})

describe('creem create-checkout POST', () => {
  it('未登录 → 401', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await POST(postReq({ period: 'monthly' }))
    expect(res.status).toBe(401)
  })
  it('未配置 Creem → 503', async () => {
    ;(isCreemConfigured as any).mockReturnValue(false)
    const res = await POST(postReq({ period: 'monthly' }))
    expect(res.status).toBe(503)
  })
  it('monthly → 创建 checkout，订单 PENDING，返回 url+sessionId', async () => {
    ;(createCheckout as any).mockResolvedValue({ checkoutUrl: 'https://creem/checkout/abc', sessionId: 'ch_abc' })
    const res = await POST(postReq({ period: 'monthly' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toBe('https://creem/checkout/abc')
    expect(json.sessionId).toBe('ch_abc')
    expect(prismaMock.paymentOrder.upsert).toHaveBeenCalled()
    const order = stores.orders.get('CKCR20260825A1B2C3D4')
    expect(order.status).toBe('PENDING')
    expect(order.channel).toBe('creem')
  })
  it('annual → 使用年度产品ID', async () => {
    ;(createCheckout as any).mockResolvedValue({ checkoutUrl: 'u', sessionId: 'ch_x' })
    process.env.CREEM_ANNUAL_PRODUCT_ID = 'prod_annual'
    const res = await POST(postReq({ period: 'annual' }))
    const json = await res.json()
    expect(json.sessionId).toBe('ch_x')
    expect((createCheckout as any).mock.calls[0][0].productId).toBe('prod_annual')
  })
})

describe('creem create-checkout GET（轮询支付状态）', () => {
  it('未登录 → 401', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await GET(getReq('http://localhost/api/creem/create-checkout?checkoutId=ch_1'))
    expect(res.status).toBe(401)
  })
  it('无 checkoutId → 返回 PENDING 订单', async () => {
    stores.orders.set('CKCRpending', { id: 'CKCRpending', userId: 'u1', channel: 'creem', status: 'PENDING', orderId: 'CKCRpending', amount: 2000 })
    const res = await GET(getReq('http://localhost/api/creem/create-checkout'))
    const json = await res.json()
    expect(json.checkoutId).toBe('CKCRpending')
  })
  it('已支付 checkout 属于当前用户 → 升级 PRO + 写入到期', async () => {
    ;(retrieveCheckout as any).mockResolvedValue({ status: 'completed', metadata: { userId: 'u1', period: 'monthly' } })
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    stores.orders.set('CKCRpending', { id: 'CKCRpending', userId: 'u1', channel: 'creem', status: 'PENDING', orderId: 'CKCRpending', amount: 2000 })
    const res = await GET(getReq('http://localhost/api/creem/create-checkout?checkoutId=ch_1'))
    const json = await res.json()
    expect(json.paid).toBe(true)
    expect(json.message).toContain('升级')
    expect(stores.users.get('u1').subscriptionTier).toBe('PRO')
    expect(stores.users.get('u1').subscriptionExpiryDate).toBeTruthy()
  })
  it('checkout 不属于当前用户 → 403', async () => {
    ;(retrieveCheckout as any).mockResolvedValue({ status: 'completed', metadata: { userId: 'other', period: 'monthly' } })
    const res = await GET(getReq('http://localhost/api/creem/create-checkout?checkoutId=ch_1'))
    expect(res.status).toBe(403)
  })
})
