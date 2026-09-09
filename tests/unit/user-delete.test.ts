// 账号删除测试：验证码校验 + 删号前必须先取消上游 Creem 订阅（fail-closed，防删号后继续扣费）
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@cookmate/shared/api/creem', () => ({ cancelSubscription: vi.fn() }))
import { auth } from '@/lib/auth'
import { cancelSubscription } from '@cookmate/shared/api/creem'
import { POST } from '@/app/api/user/delete/route'

function req(body: object) {
  return new Request('http://localhost/api/user/delete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  resetPrisma()
  vi.mocked(cancelSubscription).mockReset()
  vi.mocked(cancelSubscription).mockResolvedValue(undefined)
  auth.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
  stores.users.set('u1', { id: 'u1', email: 'a@b.com', creemSubscriptionId: 'sub_123' })
  stores.codes.set('vc1', { id: 'vc1', email: 'a@b.com', code: '123456', used: false, expiresAt: new Date(Date.now() + 300000), createdAt: new Date(Date.now() - 70000) })
})

describe('POST /api/user/delete', () => {
  it('未登录 → 401', async () => {
    auth.mockResolvedValue(null)
    const res = await POST(req({ email: 'a@b.com', code: '123456' }))
    expect(res.status).toBe(401)
  })

  it('demo 用户 → 403', async () => {
    auth.mockResolvedValue({ user: { id: 'demo-user-id', email: 'demo@cookmate.local' } })
    const res = await POST(req({ email: 'demo@cookmate.local', code: '123456' }))
    expect(res.status).toBe(403)
  })

  it('缺验证码 → 400', async () => {
    const res = await POST(req({ email: 'a@b.com' }))
    expect(res.status).toBe(400)
  })

  it('邮箱与登录账号不匹配 → 400', async () => {
    const res = await POST(req({ email: 'other@b.com', code: '123456' }))
    expect(res.status).toBe(400)
  })

  it('验证码错误/过期 → 400，账号保留', async () => {
    const res = await POST(req({ email: 'a@b.com', code: '999999' }))
    expect(res.status).toBe(400)
    expect(stores.users.has('u1')).toBe(true)
  })

  it('上游订阅取消失败 → 500 中止删号，账号与订阅ID 保留，写 failed 审计', async () => {
    vi.mocked(cancelSubscription).mockRejectedValue(new Error('creem down'))
    const res = await POST(req({ email: 'a@b.com', code: '123456' }))
    expect(res.status).toBe(500)
    expect(stores.users.has('u1')).toBe(true)
    expect(stores.users.get('u1').creemSubscriptionId).toBe('sub_123')
    const failed = [...stores.logs.values()].filter((l: any) => l.source === 'cancel' && l.status === 'failed')
    expect(failed.length).toBe(1)
  })

  it('成功删除：先取消上游订阅 → 标记验证码已用 → 级联删号 + 写 completed 审计', async () => {
    const res = await POST(req({ email: 'a@b.com', code: '123456' }))
    const j = await res.json()
    expect(res.status).toBe(200)
    expect(j.success).toBe(true)
    expect(cancelSubscription).toHaveBeenCalledWith('sub_123')
    expect(stores.users.has('u1')).toBe(false)
    expect(stores.codes.get('vc1').used).toBe(true)
    const done = [...stores.logs.values()].filter((l: any) => l.source === 'cancel' && l.status === 'completed')
    expect(done.length).toBe(1)
  })

  it('无上游订阅（支付宝一次性付款）→ 直接删号，不调 cancelSubscription', async () => {
    stores.users.set('u1', { id: 'u1', email: 'a@b.com' }) // 无 creemSubscriptionId
    const res = await POST(req({ email: 'a@b.com', code: '123456' }))
    expect(res.status).toBe(200)
    expect(cancelSubscription).not.toHaveBeenCalled()
    expect(stores.users.has('u1')).toBe(false)
  })
})
