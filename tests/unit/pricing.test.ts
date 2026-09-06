// 定价常量测试（支付宝修复依赖 PRICING 金额匹配计费周期）
import { describe, it, expect } from 'vitest'
import { PRICING } from '@cookmate/shared/constants/pricing'

describe('PRICING', () => {
  it('monthly CNY=2900, annual CNY=19900', () => {
    expect(PRICING.get('monthly', 'CNY').amount).toBe(2900)
    expect(PRICING.get('annual', 'CNY').amount).toBe(19900)
  })
  it('quarterly / semiannual 存在且金额正确', () => {
    expect(PRICING.get('quarterly', 'CNY').amount).toBe(7800)
    expect(PRICING.get('semiannual', 'CNY').amount).toBe(13800)
  })
  it('USD 可用', () => {
    expect(PRICING.get('monthly', 'USD').amount).toBe(499)
  })
})
