// 购物清单勾选同步食材库测试：免费版上限、upsert 新增/已存在、所有权隔离
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
import { auth } from '@/lib/auth'
import { PANTRY_ITEM_LIMIT } from '@cookmate/shared/constants/usage-limits'
import { SUBSCRIPTION_TIER } from '@cookmate/shared/constants'
import { POST, DELETE } from '@/app/api/grocery-list/purchase/route'

function postReq(body: object) {
  return new Request('http://localhost/api/grocery-list/purchase', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}
function deleteReq(body: object) {
  return new Request('http://localhost/api/grocery-list/purchase', {
    method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => {
  resetPrisma()
  auth.mockResolvedValue({ user: { id: 'u1' } })
  stores.users.set('u1', { id: 'u1', subscriptionTier: SUBSCRIPTION_TIER.FREE })
})

function seedPantry(userId: string, n: number) {
  for (let i = 0; i < n; i++) {
    stores.pantries.set(`${userId}_pi${i}`, { id: `${userId}_pi${i}`, userId, name: `食材${userId}_${i}` })
  }
}

describe('POST /api/grocery-list/purchase', () => {
  it('未登录 → 401', async () => {
    auth.mockResolvedValue(null)
    const res = await POST(postReq({ name: '鸡蛋' }))
    expect(res.status).toBe(401)
  })

  it('空名称 → 400', async () => {
    const res = await POST(postReq({ name: '   ' }))
    expect(res.status).toBe(400)
  })

  it('免费版已达食材库上限 → 403', async () => {
    seedPantry('u1', PANTRY_ITEM_LIMIT)
    const res = await POST(postReq({ name: '新食材' }))
    expect(res.status).toBe(403)
  })

  it('免费版未达上限 → 200 新增', async () => {
    const res = await POST(postReq({ name: '西红柿' }))
    const j = await res.json()
    expect(res.status).toBe(200)
    expect(j.success).toBe(true)
    expect(j.alreadyExists).toBe(false)
    expect(j.item.name).toBe('西红柿')
  })

  it('已存在同名条目 → 200 alreadyExists=true，不重复创建、不占额度', async () => {
    stores.pantries.set('p1', { id: 'p1', userId: 'u1', name: '鸡蛋', createdAt: new Date(0), updatedAt: new Date(0) })
    const before = stores.pantries.size
    const res = await POST(postReq({ name: '鸡蛋' }))
    const j = await res.json()
    expect(res.status).toBe(200)
    expect(j.alreadyExists).toBe(true)
    expect(stores.pantries.size).toBe(before)
  })

  it('PRO 用户不受免费版上限约束', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: SUBSCRIPTION_TIER.PRO })
    seedPantry('u1', PANTRY_ITEM_LIMIT)
    const res = await POST(postReq({ name: '新食材' }))
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/grocery-list/purchase', () => {
  it('未登录 → 401', async () => {
    auth.mockResolvedValue(null)
    const res = await DELETE(deleteReq({ name: '鸡蛋' }))
    expect(res.status).toBe(401)
  })

  it('只删自己的同名条目，别人的保留', async () => {
    stores.pantries.set('p1', { id: 'p1', userId: 'u1', name: '鸡蛋' })
    stores.pantries.set('p2', { id: 'p2', userId: 'u2', name: '鸡蛋' })
    const res = await DELETE(deleteReq({ name: '鸡蛋' }))
    const j = await res.json()
    expect(res.status).toBe(200)
    expect(j.success).toBe(true)
    expect(stores.pantries.has('p1')).toBe(false)
    expect(stores.pantries.has('p2')).toBe(true)
  })
})
