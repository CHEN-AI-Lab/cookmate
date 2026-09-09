// Cron 路由测试：expire-sweep（过期降级）+ reconcile-cancellations（取消对账）
// 重点：鉴权 fail-closed（CRON_SECRET 未配置必须 500 拒绝）、降级条件、幂等、审计日志
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})

import { GET as sweepGET } from '@/app/api/cron/expire-sweep/route'
import { GET as reconcileGET } from '@/app/api/cron/reconcile-cancellations/route'
import { SUBSCRIPTION_TIER } from '@cookmate/shared/constants'

function req(path: string, token?: string) {
  return new Request(`http://localhost${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  })
}

const DAY = 86400000

beforeEach(() => {
  resetPrisma()
  process.env.CRON_SECRET = 'secret123'
})

describe('GET /api/cron/expire-sweep', () => {
  it('CRON_SECRET 未配置 → 500（fail-closed，绝不裸奔执行）', async () => {
    const prev = process.env.CRON_SECRET
    delete process.env.CRON_SECRET
    try {
      const res = await sweepGET(req('/api/cron/expire-sweep', 'secret123'))
      expect(res.status).toBe(500)
    } finally {
      process.env.CRON_SECRET = prev
    }
  })

  it('无 Authorization 头 → 401', async () => {
    const res = await sweepGET(req('/api/cron/expire-sweep'))
    expect(res.status).toBe(401)
  })

  it('token 错误 → 401', async () => {
    const res = await sweepGET(req('/api/cron/expire-sweep', 'wrong'))
    expect(res.status).toBe(401)
  })

  it('只降级已过期 PRO；未到期 PRO 与 FREE 均不动', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: SUBSCRIPTION_TIER.PRO, subscriptionExpiryDate: new Date(Date.now() - DAY) })
    stores.users.set('u2', { id: 'u2', subscriptionTier: SUBSCRIPTION_TIER.PRO, subscriptionExpiryDate: new Date(Date.now() + DAY) })
    stores.users.set('u3', { id: 'u3', subscriptionTier: SUBSCRIPTION_TIER.FREE, subscriptionExpiryDate: new Date(Date.now() - DAY) })

    const res = await sweepGET(req('/api/cron/expire-sweep', 'secret123'))
    const j = await res.json()
    expect(res.status).toBe(200)
    expect(j.success).toBe(true)
    expect(j.count).toBe(1)
    expect(stores.users.get('u1').subscriptionTier).toBe(SUBSCRIPTION_TIER.FREE)
    expect(stores.users.get('u1').subscriptionExpiryDate).toBeNull()
    expect(stores.users.get('u2').subscriptionTier).toBe(SUBSCRIPTION_TIER.PRO)
    expect(stores.users.get('u3').subscriptionTier).toBe(SUBSCRIPTION_TIER.FREE)
  })

  it('幂等：重复执行第二次 count=0', async () => {
    stores.users.set('u1', { id: 'u1', subscriptionTier: SUBSCRIPTION_TIER.PRO, subscriptionExpiryDate: new Date(Date.now() - DAY) })
    await sweepGET(req('/api/cron/expire-sweep', 'secret123'))
    const res2 = await sweepGET(req('/api/cron/expire-sweep', 'secret123'))
    const j2 = await res2.json()
    expect(j2.count).toBe(0)
  })

  it('成功执行写 cron 审计日志（processed）', async () => {
    await sweepGET(req('/api/cron/expire-sweep', 'secret123'))
    const logs = [...stores.logs.values()].filter((l: any) => l.source === 'cron')
    expect(logs.some((l: any) => l.eventType === 'expire-sweep' && l.status === 'processed')).toBe(true)
  })
})

describe('GET /api/cron/reconcile-cancellations', () => {
  it('token 错误 → 401', async () => {
    const res = await reconcileGET(req('/api/cron/reconcile-cancellations', 'nope'))
    expect(res.status).toBe(401)
  })

  it('CRON_SECRET 未配置 → 500（fail-closed）', async () => {
    const prev = process.env.CRON_SECRET
    delete process.env.CRON_SECRET
    try {
      const res = await reconcileGET(req('/api/cron/reconcile-cancellations', 'secret123'))
      expect(res.status).toBe(500)
    } finally {
      process.env.CRON_SECRET = prev
    }
  })

  it('正确统计 failed/completed，报告含失败订阅ID，且不串其他 source', async () => {
    stores.logs.set('l1', { id: 'l1', source: 'cancel', status: 'failed', eventType: 'creem', rawBody: JSON.stringify({ userId: 'u1', subscriptionId: 'sub_fail_1', error: 'boom' }), createdAt: new Date() })
    stores.logs.set('l2', { id: 'l2', source: 'cancel', status: 'completed', eventType: 'creem', rawBody: JSON.stringify({ userId: 'u2', subscriptionId: 'sub_ok_1' }), createdAt: new Date() })
    stores.logs.set('l3', { id: 'l3', source: 'alipay', status: 'failed', eventType: 'TRADE_SUCCESS', rawBody: 'x', createdAt: new Date() })

    const res = await reconcileGET(req('/api/cron/reconcile-cancellations', 'secret123'))
    const j = await res.json()
    expect(res.status).toBe(200)
    expect(j.completedCount).toBe(1)
    expect(j.failedCount).toBe(1)
    expect(j.report).toContain('sub_fail_1')
    expect(j.report).not.toContain('alipay')
  })
})
