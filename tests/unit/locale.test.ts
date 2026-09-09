import { describe, it, expect } from 'vitest'
import { getLocaleFromCookie, e, t, err } from '@cookmate/shared/utils/locale'

describe('getLocaleFromCookie', () => {
  it('reads NEXT_LOCALE from cookie header', () => {
    const req = new Request('http://localhost', { headers: { cookie: 'NEXT_LOCALE=en; foo=bar' } })
    expect(getLocaleFromCookie(req)).toBe('en')
  })

  it('defaults to zh-CN when no cookie', () => {
    const req = new Request('http://localhost')
    expect(getLocaleFromCookie(req)).toBe('zh-CN')
  })

  it('defaults to zh-CN when other cookies present', () => {
    const req = new Request('http://localhost', { headers: { cookie: 'session=abc' } })
    expect(getLocaleFromCookie(req)).toBe('zh-CN')
  })
})

describe('e / t', () => {
  it('returns English for en locale', () => {
    expect(e('en', '中文', 'English')).toBe('English')
    expect(t('en-US', '中文', 'English')).toBe('English')
  })

  it('returns Chinese for other locales', () => {
    expect(e('zh-CN', '中文', 'English')).toBe('中文')
    expect(t('ja', '中文', 'English')).toBe('中文')
  })
})

describe('err', () => {
  it('translates known error keys to Chinese by default', () => {
    const result = err('zh-CN', 'userNotFound')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('translates known error keys to English', () => {
    const result = err('en', 'userNotFound')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns the key itself for unknown keys', () => {
    expect(err('zh-CN', 'nonexistent_key_xyz')).toBe('nonexistent_key_xyz')
  })
})