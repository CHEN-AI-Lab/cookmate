import { describe, it, expect } from 'vitest';
import { cn, slugify, truncate, formatDuration, formatDate, getWeekDates, estimateCalories } from '../../utils/index';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('filters falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('handles Chinese characters', () => {
    expect(slugify('番茄炒蛋')).toBe('番茄炒蛋');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
  });

  it('collapses multiple separators', () => {
    expect(slugify('a  b   c')).toBe('a-b-c');
  });
});

describe('truncate', () => {
  it('returns text when within maxLength', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('truncates long text at word boundary', () => {
    expect(truncate('hello world foo', 8)).toBe('hello…');
  });

  it('appends ellipsis', () => {
    const result = truncate('abcdefghij', 5);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(30)).toBe('30分钟');
  });

  it('formats whole hours', () => {
    expect(formatDuration(120)).toBe('2小时');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1小时30分钟');
  });
});

describe('formatDate', () => {
  it('formats a date in Chinese locale', () => {
    const result = formatDate(new Date('2024-01-15T00:00:00Z'));
    expect(result).toContain('1月');
  });
});

describe('getWeekDates', () => {
  it('returns 7 consecutive days', () => {
    const dates = getWeekDates('2024-01-01');
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe('2024-01-01');
    expect(dates[6]).toBe('2024-01-07');
  });

  it('handles month boundaries', () => {
    const dates = getWeekDates('2024-01-29');
    expect(dates[0]).toBe('2024-01-29');
    expect(dates[3]).toBe('2024-02-01');
  });
});

describe('estimateCalories', () => {
  it('computes round(0.5 * amount) per ingredient', () => {
    const ingredients = [
      { amount: 100, unit: 'g', name: 'chicken' },
      { amount: 200, unit: 'g', name: 'rice' },
    ];
    expect(estimateCalories(ingredients)).toBe(150);
  });

  it('returns 0 for empty list', () => {
    expect(estimateCalories([])).toBe(0);
  });
});