import { describe, it, expect } from 'vitest'
import { cn, formatDate, DAYS_SHORT } from '@cookmate/shared/utils'
import { locales, defaultLocale } from '@cookmate/shared/constants'

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

describe('locales config', () => {
  it('has zh-CN, zh-TW and en', () => {
    expect(locales).toEqual(['zh-CN', 'zh-TW', 'en'])
  })

  it('default is en', () => {
    expect(defaultLocale).toBe('en')
  })
})

describe('DAYS_SHORT', () => {
  it('has 7 days', () => {
    expect(DAYS_SHORT).toHaveLength(7)
  })

  it('starts with Monday', () => {
    expect(DAYS_SHORT[0]).toBe('一')
  })
})

describe('formatDate', () => {
  it('formats a date in Chinese', () => {
    const d = new Date(2026, 5, 25)
    const result = formatDate(d)
    expect(result).toContain('6月')
    expect(result).toContain('25日')
  })
})

describe('t() i18n loader', () => {
  it('resolves dot-separated keys', () => {
    const { t } = require('@cookmate/shared/i18n')
    expect(t('zh-CN', 'home.title')).toBeTruthy()
    expect(t('en', 'home.title')).toBeTruthy()
  })

  it('falls back to key path for missing keys', () => {
    const { t } = require('@cookmate/shared/i18n')
    expect(t('zh-CN', 'nonexistent.key')).toBe('nonexistent.key')
  })

  it('returns fallback text when provided', () => {
    const { t } = require('@cookmate/shared/i18n')
    expect(t('zh-CN', 'nonexistent.key', '默认')).toBe('默认')
  })
})