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
    expect(prismaMock.paymentOrder.create).toHaveBeenCalled()
    const order = stores.orders.get('CKCR20260825A1B2C3D4')
    expect(order.status).toBe('PENDING')
    expect(order.channel).toBe('creem')
    expect(order.externalCheckoutId).toBe('ch_abc') // Creem sessionId 用于精确反查
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
  it('无 checkoutId → 返回 PENDING 订单的 externalCheckoutId', async () => {
    stores.orders.set('CKCRpending', { id: 'CKCRpending', userId: 'u1', channel: 'creem', status: 'PENDING', orderId: 'CKCRpending', externalCheckoutId: 'ch_seed_1', amount: 2000 })
    const res = await GET(getReq('http://localhost/api/creem/create-checkout'))
    const json = await res.json()
    expect(json.checkoutId).toBe('ch_seed_1') // 现在返回 externalCheckoutId（Creem ch_xxx）而非本地 orderId
  })
  it('已支付 checkout 属于当前用户 → 升级 PRO + 写入到期', async () => {
    ;(retrieveCheckout as any).mockResolvedValue({ status: 'completed', metadata: { userId: 'u1', period: 'monthly' } })
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    // 必须 seed 与 retrieveCheckout 返回的 checkoutId 一致的 externalCheckoutId，否则无法精确匹配
    stores.orders.set('CKCRpending', { id: 'CKCRpending', userId: 'u1', channel: 'creem', status: 'PENDING', orderId: 'CKCRpending', externalCheckoutId: 'ch_1', amount: 2000 })
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

  // P0 加固：Creem GET 路径不再用「最近 PENDING」匹配，改用 externalCheckoutId 精确反查
  it('多个 PENDING 订单时，只匹配 externalCheckoutId 一致的那个（防止匹配错订单）', async () => {
    ;(retrieveCheckout as any).mockResolvedValue({ status: 'completed', metadata: { userId: 'u1', period: 'monthly' } })
    stores.users.set('u1', { id: 'u1', subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeCustomerId: null, stripeSubscriptionId: null })
    // 种两个 PENDING：一个旧 abandoned（externalCheckoutId=ch_old），一个新刚 checkout 的（externalCheckoutId=ch_new）
    stores.orders.set('CKCRold', { id: 'CKCRold', orderId: 'CKCRold', externalCheckoutId: 'ch_old', userId: 'u1', channel: 'creem', status: 'PENDING', amount: 2000, createdAt: Date.now() - 10000 })
    stores.orders.set('CKCRnew', { id: 'CKCRnew', orderId: 'CKCRnew', externalCheckoutId: 'ch_new', userId: 'u1', channel: 'creem', status: 'PENDING', amount: 2000, createdAt: Date.now() })
    // 轮询 ch_old（已完成支付）→ 只该订单升级 PAID
    const res = await GET(getReq('http://localhost/api/creem/create-checkout?checkoutId=ch_old'))
    expect((await res.json()).paid).toBe(true)
    expect(stores.orders.get('CKCRold').status).toBe('PAID')
    expect(stores.orders.get('CKCRnew').status).toBe('PENDING') // 不动
    // 旧的 findFirst 按 userId 匹配会先取到 CKCRold（更早），但现在精确匹配只命中 CKCRold
  })

  it('轮询一个非本用户的 checkoutId → 403（不暴露订单存在性）', async () => {
    ;(retrieveCheckout as any).mockResolvedValue({ status: 'completed', metadata: { userId: 'other_user', period: 'monthly' } })
    const res = await GET(getReq('http://localhost/api/creem/create-checkout?checkoutId=ch_xyz'))
    expect(res.status).toBe(403)
  })
})
