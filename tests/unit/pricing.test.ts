// 定价常量测试（支付宝修复依赖 PRICING 金额匹配计费周期）
import { describe, it, expect } from 'vitest'
import { PRICING } from '@cookmate/shared/constants/pricing'

describe('PRICING', () => {
  it('monthly CNY=2000, annual CNY=11900', () => {
    expect(PRICING.get('monthly', 'CNY').amount).toBe(2000)
    expect(PRICING.get('annual', 'CNY').amount).toBe(11900)
  })
  it('quarterly / semiannual 存在且金额正确', () => {
    expect(PRICING.get('quarterly', 'CNY').amount).toBe(5100)
    expect(PRICING.get('semiannual', 'CNY').amount).toBe(9000)
  })
  it('USD 可用', () => {
    expect(PRICING.get('monthly', 'USD').amount).toBe(299)
  })
})
