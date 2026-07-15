import { describe, it, expect } from 'vitest'
import { generateOrderId } from '@cookmate/shared/utils'
import { isAlipayConfigured } from '@cookmate/shared/api/alipay-pay'

describe('alipay-pay - generateOrderId', () => {
  it('returns a non-empty string starting with CK', () => {
    const id = generateOrderId('alipay')
    expect(id).toBeTruthy()
    expect(id.startsWith('CK')).toBe(true)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateOrderId('alipay')))
    expect(ids.size).toBe(100)
  })
})

describe('alipay-pay - isAlipayConfigured', () => {
  it('returns false when env vars are not set', () => {
    // In test env, no Alipay env vars are set
    expect(isAlipayConfigured()).toBe(false)
  })
})