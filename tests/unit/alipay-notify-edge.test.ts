// 支付宝回调边界：TRADE_SUCCESS 但缺 out_trade_no → 必须 400 failure（否则付款被静默吞掉）
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPrisma, stores } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@cookmate/shared/api/alipay-pay', () => ({
  verifyNotify: vi.fn(),
  isAlipayConfigured: vi.fn(() => true),
  createPagePay: vi.fn(),
}))
import { verifyNotify } from '@cookmate/shared/api/alipay-pay'
import { POST as notifyPOST } from '@/app/api/alipay/notify/route'

function notify(params: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(params)) fd.append(k, v)
  return new Request('http://localhost/api/alipay/notify', { method: 'POST', body: fd })
}

beforeEach(() => {
  resetPrisma()
  verifyNotify.mockReturnValue(true)
  process.env.AUTH_ALIPAY_ID = 'appid123'
  process.env.AUTH_ALIPAY_PUBLIC_KEY = 'pubkey'
})

describe('支付宝通知边界（out_trade_no 缺失防护）', () => {
  it('TRADE_SUCCESS 但缺 out_trade_no → 400 failure + 审计 failed:no-out-trade-no（让支付宝重发）', async () => {
    const res = await notifyPOST(notify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS' }))
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('failure')
    const logs = [...stores.logs.values()].filter((l: any) => l.source === 'alipay')
    expect(logs.some((l: any) => l.status === 'failed:no-out-trade-no')).toBe(true)
    // 绝不能写 processed（processed = 已妥善处理）
    expect(logs.some((l: any) => l.status === 'processed')).toBe(false)
  })

  it('TRADE_SUCCESS + out_trade_no 但订单不存在 → 400 failure（回归保护）', async () => {
    const res = await notifyPOST(notify({ app_id: 'appid123', trade_status: 'TRADE_SUCCESS', out_trade_no: 'CK_NOT_EXIST' }))
    expect(res.status).toBe(400)
    expect(await res.text()).toBe('failure')
  })
})
