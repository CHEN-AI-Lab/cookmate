// stripe/create-checkout 路由测试：鉴权、体验用户、配置/参数校验、customer 创建/复用、成功下单
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock, resetPrisma, stores } from './_helpers/mock-prisma'

const fakeStripe = {
  customers: { create: vi.fn(async () => ({ id: 'cus_1' })) },
  checkout: { sessions: { create: vi.fn(async () => ({ url: 'https://stripe/checkout/cs_1' })) } },
}

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/auth-helpers', () => ({ isDemoUser: vi.fn(() => false) }))
vi.mock('@cookmate/shared/api/stripe', () => ({ getStripe: vi.fn(() => fakeStripe) }))

import { auth } from '@/lib/auth'
import { isDemoUser } from '@/lib/auth-helpers'
import { POST } from '@/app/api/stripe/create-checkout/route'

function postReq(body: any) {
  return new Request('http://localhost/api/stripe/create-checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
}

beforeEach(() => {
  resetPrisma()
  ;(auth as any).mockResolvedValue({ user: { id: 'u1', email: 'u1@x.com', name: 'U' } })
  ;(isDemoUser as any).mockReturnValue(false)
  fakeStripe.customers.create.mockClear()
  fakeStripe.checkout.sessions.create.mockClear()
  process.env.STRIPE_SECRET_KEY = 'sk_test'
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test'
  process.env.STRIPE_PRO_PRICE_ID = 'price_pro'
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.cookmate.com'
  stores.users.set('u1', { id: 'u1', email: 'u1@x.com', name: 'U', stripeCustomerId: null, subscriptionTier: 'FREE', subscriptionExpiryDate: null, creemSubscriptionId: null, stripeSubscriptionId: null })
})

describe('stripe create-checkout POST', () => {
  it('未登录 → 401', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await POST(postReq({ tier: 'pro' }))
    expect(res.status).toBe(401)
  })
  it('体验用户 → 403', async () => {
    ;(isDemoUser as any).mockReturnValue(true)
    ;(auth as any).mockResolvedValue({ user: { id: 'demo', email: 'demo@cookmate.local' } })
    const res = await POST(postReq({ tier: 'pro' }))
    expect(res.status).toBe(403)
  })
  it('未配置 Stripe → 503', async () => {
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const res = await POST(postReq({ tier: 'pro' }))
    expect(res.status).toBe(503)
  })
  it('tier 非 pro → 400', async () => {
    const res = await POST(postReq({ tier: 'free' }))
    expect(res.status).toBe(400)
  })
  it('缺少价格ID → 400', async () => {
    delete process.env.STRIPE_PRO_PRICE_ID
    const res = await POST(postReq({ tier: 'pro' }))
    expect(res.status).toBe(400)
  })
  it('用户不存在 → 404', async () => {
    stores.users.delete('u1')
    const res = await POST(postReq({ tier: 'pro' }))
    expect(res.status).toBe(404)
  })
  it('正常 → 创建 customer + session，返回 url', async () => {
    const res = await POST(postReq({ tier: 'pro' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toBe('https://stripe/checkout/cs_1')
    expect(fakeStripe.checkout.sessions.create).toHaveBeenCalled()
    expect(stores.users.get('u1').stripeCustomerId).toBe('cus_1')
  })
  it('已有 customerId → 不再创建 customer', async () => {
    stores.users.set('u1', { ...stores.users.get('u1'), stripeCustomerId: 'cus_existing' })
    const res = await POST(postReq({ tier: 'pro' }))
    expect(res.status).toBe(200)
    expect(fakeStripe.customers.create).not.toHaveBeenCalled()
  })
})
