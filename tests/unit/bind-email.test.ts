// 绑定邮箱测试：POST 发码（含 60s 频控防轰炸）+ PUT 校验并绑定
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
import { auth } from '@/lib/auth'
import { POST, PUT } from '@/app/api/user/bind-email/route'

function postReq(body: object) {
  return new Request('http://localhost/api/user/bind-email', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}
function putReq(body: object) {
  return new Request('http://localhost/api/user/bind-email', {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => {
  resetPrisma()
  auth.mockResolvedValue({ user: { id: 'u1', email: 'old@b.com' } })
  stores.users.set('u1', { id: 'u1', email: 'old@b.com' })
  process.env.RESEND_API_KEY = 'test-key'
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true })))
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('POST /api/user/bind-email（发送验证码）', () => {
  it('未登录 → 401', async () => {
    auth.mockResolvedValue(null)
    const res = await POST(postReq({ email: 't@b.com' }))
    expect(res.status).toBe(401)
  })

  it('demo 用户 → 403', async () => {
    auth.mockResolvedValue({ user: { id: 'demo-user-id' } })
    const res = await POST(postReq({ email: 't@b.com' }))
    expect(res.status).toBe(403)
  })

  it('邮箱格式非法 → 400', async () => {
    const res = await POST(postReq({ email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('60 秒内已发过未用验证码 → 429（防邮件轰炸）', async () => {
    stores.codes.set('c1', { id: 'c1', email: 't1@b.com', code: '111111', used: false, createdAt: new Date(), expiresAt: new Date(Date.now() + 300000) })
    const res = await POST(postReq({ email: 't1@b.com' }))
    expect(res.status).toBe(429)
  })

  it('正常发码 → 200，验证码落库且未使用', async () => {
    const res = await POST(postReq({ email: 't2@b.com' }))
    const j = await res.json()
    expect(res.status).toBe(200)
    expect(j.success).toBe(true)
    const codes = [...stores.codes.values()].filter((c: any) => c.email === 't2@b.com' && !c.used)
    expect(codes.length).toBe(1)
    expect(j.devCode).toBeUndefined() // 非 dev 环境不回显
  })

  it('dev 环境回显 devCode（与落库一致）', async () => {
    const prev = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    try {
      const res = await POST(postReq({ email: 't3@b.com' }))
      const j = await res.json()
      expect(res.status).toBe(200)
      const rec = [...stores.codes.values()].find((c: any) => c.email === 't3@b.com')
      expect(j.devCode).toBe(rec.code)
    } finally {
      process.env.NODE_ENV = prev
    }
  })
})

describe('PUT /api/user/bind-email（校验并绑定）', () => {
  it('未登录 → 401', async () => {
    auth.mockResolvedValue(null)
    const res = await PUT(putReq({ email: 'x@b.com', code: '123456' }))
    expect(res.status).toBe(401)
  })

  it('验证码错误 → 400', async () => {
    const res = await PUT(putReq({ email: 'p1@b.com', code: '000000' }))
    expect(res.status).toBe(400)
  })

  it('邮箱已被其他账号绑定 → 409，验证码正常校验通过', async () => {
    stores.users.set('u2', { id: 'u2', email: 'taken@b.com' })
    stores.codes.set('c2', { id: 'c2', email: 'taken@b.com', code: '123456', used: false, expiresAt: new Date(Date.now() + 300000), createdAt: new Date(Date.now() - 70000) })
    const res = await PUT(putReq({ email: 'taken@b.com', code: '123456' }))
    expect(res.status).toBe(409)
  })

  it('绑定成功：更新用户邮箱 + 验证码一次性消费', async () => {
    stores.codes.set('c3', { id: 'c3', email: 'fresh@b.com', code: '123456', used: false, expiresAt: new Date(Date.now() + 300000), createdAt: new Date(Date.now() - 70000) })
    const res = await PUT(putReq({ email: 'fresh@b.com', code: '123456' }))
    const j = await res.json()
    expect(res.status).toBe(200)
    expect(j.success).toBe(true)
    expect(stores.users.get('u1').email).toBe('fresh@b.com')
    expect(stores.codes.get('c3').used).toBe(true)
    // 同一验证码第二次使用 → 400（一次性）
    const res2 = await PUT(putReq({ email: 'fresh@b.com', code: '123456' }))
    expect(res2.status).toBe(400)
  })
})
