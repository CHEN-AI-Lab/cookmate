// DELETE /api/orders/[orderId] 测试：跨用户访问不再泄露订单存在性
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
import { auth } from '@/lib/auth'

import { DELETE } from '@/app/api/orders/[orderId]/route'

function delReq(orderId: string) {
  return new Request(`http://localhost/api/orders/${orderId}`, { method: 'DELETE' })
}

beforeEach(() => {
  resetPrisma()
  auth.mockResolvedValue({ user: { id: 'u1' } })
})

describe('DELETE /api/orders/[orderId]', () => {
  it('未登录 → 401', async () => {
    auth.mockResolvedValue(null)
    const res = await DELETE(delReq('any'), { params: Promise.resolve({ orderId: 'any' }) })
    expect(res.status).toBe(401)
  })

  it('自己 PENDING 订单 → 200 删除', async () => {
    stores.orders.set('CKCRmine', { id: 'CKCRmine', orderId: 'CKCRmine', userId: 'u1', channel: 'creem', status: 'PENDING', amount: 2000 })
    const res = await DELETE(delReq('CKCRmine'), { params: Promise.resolve({ orderId: 'CKCRmine' }) })
    expect(res.status).toBe(200)
    expect(stores.orders.has('CKCRmine')).toBe(false)
  })

  // P0 加固：跨用户访问统一返 404（不再泄露订单存在性）
  it('别人的订单 → 404（不区分「不存在」与「不是你」）', async () => {
    stores.orders.set('CKCRothers', { id: 'CKCRothers', orderId: 'CKCRothers', userId: 'u2', channel: 'creem', status: 'PENDING', amount: 2000 })
    const res = await DELETE(delReq('CKCRothers'), { params: Promise.resolve({ orderId: 'CKCRothers' }) })
    expect(res.status).toBe(404)
    // 关键：订单仍存在（不能因为删除请求而被误删）
    expect(stores.orders.has('CKCRothers')).toBe(true)
  })

  it('自己 PAID 订单 → 400 不能删', async () => {
    stores.orders.set('CKCRpaid', { id: 'CKCRpaid', orderId: 'CKCRpaid', userId: 'u1', channel: 'creem', status: 'PAID', amount: 2000 })
    const res = await DELETE(delReq('CKCRpaid'), { params: Promise.resolve({ orderId: 'CKCRpaid' }) })
    expect(res.status).toBe(400)
    expect(stores.orders.has('CKCRpaid')).toBe(true)
  })

  it('不存在的订单 → 404', async () => {
    const res = await DELETE(delReq('CKCRghost'), { params: Promise.resolve({ orderId: 'CKCRghost' }) })
    expect(res.status).toBe(404)
  })
})