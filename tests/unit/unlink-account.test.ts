// 解绑 OAuth 账号测试：保底登录方式校验（解绑后至少剩 1 种）+ 所有权
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
import { auth } from '@/lib/auth'
import { POST } from '@/app/api/user/unlink-account/route'

function req(body: object) {
  return new Request('http://localhost/api/user/unlink-account', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => {
  resetPrisma()
  auth.mockResolvedValue({ user: { id: 'u1' } })
  stores.users.set('u1', { id: 'u1', passwordHash: null })
})

describe('POST /api/user/unlink-account', () => {
  it('未登录 → 401', async () => {
    auth.mockResolvedValue(null)
    const res = await POST(req({ provider: 'github' }))
    expect(res.status).toBe(401)
  })

  it('缺 provider → 400', async () => {
    const res = await POST(req({}))
    expect(res.status).toBe(400)
  })

  it('保底登录方式（email/credentials 等）不可解绑 → 400', async () => {
    const res = await POST(req({ provider: 'email' }))
    expect(res.status).toBe(400)
    const res2 = await POST(req({ provider: 'credentials' }))
    expect(res2.status).toBe(400)
  })

  it('未绑定该 provider → 404', async () => {
    const res = await POST(req({ provider: 'google' }))
    expect(res.status).toBe(404)
  })

  it('解绑后无任何登录方式 → 400，绑定保留', async () => {
    stores.accounts.push({ id: 'a1', userId: 'u1', provider: 'github', refresh_token: null, access_token: null })
    const res = await POST(req({ provider: 'github' }))
    expect(res.status).toBe(400)
    expect(stores.accounts.length).toBe(1)
  })

  it('有密码保底 → 解绑成功，GitHub 提示需手动取消授权', async () => {
    stores.users.set('u1', { id: 'u1', passwordHash: 'hashed' })
    stores.accounts.push({ id: 'a1', userId: 'u1', provider: 'github', refresh_token: null, access_token: null })
    const res = await POST(req({ provider: 'github' }))
    const j = await res.json()
    expect(res.status).toBe(200)
    expect(j.ok).toBe(true)
    expect(j.needsManualRevoke).toBe(true)
    expect(stores.accounts.length).toBe(0)
  })
})
