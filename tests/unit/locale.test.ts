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

  it('returns Chinese for Chinese locales (zh-CN / zh-TW)', () => {
    expect(e('zh-CN', '中文', 'English')).toBe('中文')
    expect(t('zh-TW', '中文', 'English')).toBe('中文')
  })

  it('returns English for non-Chinese locales like ja（口径见 shared/constants/locales.ts 的 isChineseLocale）', () => {
    // 口径统一后走 pickLocaleText / isChineseLocale：只有中文语系取中文，
    // 其余（en / ja 等）一律英文 —— 旧实现 `locale === "en" || startsWith("en")` 会让 ja 掉回中文。
    expect(t('ja', '中文', 'English')).toBe('English')
    expect(e('ja', '中文', 'English')).toBe('English')
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