import { describe, it, expect } from 'vitest'
import { formatDuration, slugify, truncate, getWeekDates, estimateCalories } from '@cookmate/shared/utils'

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(10)).toBe('10分钟')
  })

  it('formats hours', () => {
    expect(formatDuration(60)).toBe('1小时')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1小时30分钟')
  })

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0分钟')
  })

  it('handles large values', () => {
    expect(formatDuration(150)).toBe('2小时30分钟')
  })
})

describe('slugify', () => {
  it('converts text to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('handles Chinese characters', () => {
    expect(slugify('番茄炒蛋')).toBe('番茄炒蛋')
  })

  it('strips leading/trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello')
  })

  it('handles mixed text', () => {
    expect(slugify('Hello 世界 2024')).toBe('hello-世界-2024')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })
})

describe('truncate', () => {
  it('returns text as-is when under maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates at word boundary when over maxLength', () => {
    expect(truncate('hello world foo', 12)).toBe('hello world…')
  })

  it('returns exact text when length equals maxLength', () => {
    expect(truncate('12345', 5)).toBe('12345')
  })

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('')
  })

  it('truncates without word boundary in long single word', () => {
    const result = truncate('abcdefghijklmnop', 10)
    expect(result.length).toBeLessThanOrEqual(11) // 10 chars + ellipsis
  })
})

describe('getWeekDates', () => {
  it('returns 7 dates starting from given date', () => {
    const dates = getWeekDates('2026-07-06')
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2026-07-06')
    expect(dates[6]).toBe('2026-07-12')
  })

  it('handles month boundaries', () => {
    const dates = getWeekDates('2026-12-30')
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2026-12-30')
  })
})

describe('estimateCalories', () => {
  it('estimates calories based on ingredient amounts', () => {
    const ings = [{ name: 'chicken', amount: 200, unit: 'g' }]
    const cals = estimateCalories(ings)
    expect(cals).toBeGreaterThan(0)
  })

  it('returns 0 for empty ingredients', () => {
    expect(estimateCalories([])).toBe(0)
  })
})