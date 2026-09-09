// 定价常量测试（支付宝修复依赖 PRICING 金额匹配计费周期）
import { describe, it, expect } from 'vitest'
import { PRICING, getPerMonthDisplay, getSaveAmount, getSavePercent } from '@cookmate/shared/constants/pricing'

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

describe('getPerMonthDisplay', () => {
  it('annual CNY = 199/12 ≈ 16.58', () => {
    expect(getPerMonthDisplay('annual', 'CNY')).toBe('16.58')
  })
  it('annual USD = 39.99/12 ≈ 3.33', () => {
    expect(getPerMonthDisplay('annual', 'USD')).toBe('3.33')
  })
  it('monthly CNY = 29', () => {
    expect(getPerMonthDisplay('monthly', 'CNY')).toBe('29')
  })
})

describe('getSavePercent', () => {
  it('annual CNY = 43%', () => {
    expect(getSavePercent('annual', 'CNY')).toBe(43)
  })
  it('annual USD = 33%', () => {
    expect(getSavePercent('annual', 'USD')).toBe(33)
  })
  it('quarterly CNY = 10%', () => {
    expect(getSavePercent('quarterly', 'CNY')).toBe(10)
  })
})

describe('getSaveAmount', () => {
  it('annual CNY = 2900*12 - 19900 = 14900分 = ¥149', () => {
    expect(getSaveAmount('annual', 'CNY')).toBe(14900)
  })
  it('annual USD = 499*12 - 3999 = 1989分 = $19.89', () => {
    expect(getSaveAmount('annual', 'USD')).toBe(1989)
  })
})
