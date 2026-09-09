// 食材条目 PATCH/DELETE 测试：所有权校验、不存在返回 404（不再静默 success）
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
import { auth } from '@/lib/auth'
import { PATCH, DELETE } from '@/app/api/pantry/[id]/route'

function patchReq(id: string, body: object) {
  return new Request(`http://localhost/api/pantry/${id}`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}
function deleteReq(id: string) {
  return new Request(`http://localhost/api/pantry/${id}`, { method: 'DELETE' })
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  resetPrisma()
  auth.mockResolvedValue({ user: { id: 'u1' } })
  stores.pantries.set('p1', { id: 'p1', userId: 'u1', name: '鸡蛋', category: null })
  stores.pantries.set('p2', { id: 'p2', userId: 'u1', name: '西红柿', category: null })
  stores.pantries.set('p3', { id: 'p3', userId: 'u2', name: '牛肉', category: null })
})

describe('PATCH /api/pantry/[id]', () => {
  it('未登录 → 401', async () => {
    auth.mockResolvedValue(null)
    const res = await PATCH(patchReq('p1', { name: '土鸡' }), ctx('p1'))
    expect(res.status).toBe(401)
  })

  it('与其他条目重名 → 409', async () => {
    const res = await PATCH(patchReq('p1', { name: '西红柿' }), ctx('p1'))
    expect(res.status).toBe(409)
  })

  it('不存在的条目 → 404（不再静默 success）', async () => {
    const res = await PATCH(patchReq('ghost', { name: '土鸡' }), ctx('ghost'))
    expect(res.status).toBe(404)
  })

  it('别人的条目 → 404（不泄露存在性），且条目未被改动', async () => {
    const res = await PATCH(patchReq('p3', { name: '和牛' }), ctx('p3'))
    expect(res.status).toBe(404)
    expect(stores.pantries.get('p3').name).toBe('牛肉')
  })

  it('正常更新 → 200 且字段落库', async () => {
    const res = await PATCH(patchReq('p1', { name: '土鸡蛋', quantity: '2 盒' }), ctx('p1'))
    const j = await res.json()
    expect(res.status).toBe(200)
    expect(j.success).toBe(true)
    expect(j.item.name).toBe('土鸡蛋')
    expect(j.item.quantity).toBe('2 盒')
    expect(stores.pantries.get('p1').name).toBe('土鸡蛋')
  })
})

describe('DELETE /api/pantry/[id]', () => {
  it('删除自己的条目 → 200 且已删除', async () => {
    const res = await DELETE(deleteReq('p1'), ctx('p1'))
    const j = await res.json()
    expect(res.status).toBe(200)
    expect(j.success).toBe(true)
    expect(stores.pantries.has('p1')).toBe(false)
  })

  it('别人的条目 → 200 但条目仍在（deleteMany 按 userId 隔离，不越权删）', async () => {
    const res = await DELETE(deleteReq('p3'), ctx('p3'))
    expect(res.status).toBe(200)
    expect(stores.pantries.has('p3')).toBe(true)
  })
})
