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

describe('generateOrderId - channel prefixes', () => {
  it('prefixes with CK + channel code', () => {
    expect(generateOrderId('alipay')).toMatch(/^CKAL\d{8}[0-9A-F]{8}$/)
    expect(generateOrderId('creem')).toMatch(/^CKCR\d{8}[0-9A-F]{8}$/)
  })

  it('uses XX prefix for unknown channels', () => {
    expect(generateOrderId('unknown')).toMatch(/^CKXX\d{8}[0-9A-F]{8}$/)
  })

  it('contains today\'s date', () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    expect(generateOrderId('creem')).toContain(`${y}${m}${day}`)
  })
})

describe('alipay-pay - isAlipayConfigured', () => {
  it('returns false when env vars are not set', () => {
    // In test env, no Alipay env vars are set
    expect(isAlipayConfigured()).toBe(false)
  })
})