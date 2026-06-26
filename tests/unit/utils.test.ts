import { describe, it, expect } from 'vitest'
import { cn, formatDate, DAYS_SHORT } from '../../lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'active')).toBe('base active')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })
})

describe('formatDate', () => {
  it('formats a date in Chinese locale', () => {
    const date = new Date(2026, 5, 25) // June 25, 2026
    const result = formatDate(date)
    expect(result).toContain('6月')
    expect(result).toContain('25')
  })
})

describe('DAYS_SHORT', () => {
  it('contains 7 Chinese day abbreviations', () => {
    expect(DAYS_SHORT).toHaveLength(7)
    expect(DAYS_SHORT).toEqual(['一', '二', '三', '四', '五', '六', '日'])
  })
})
