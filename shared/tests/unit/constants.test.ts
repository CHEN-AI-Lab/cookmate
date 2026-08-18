import { describe, it, expect } from 'vitest';
import { locales, defaultLocale, localeNames } from '../../constants/locales';
import { apiError, API_ERRORS } from '../../constants/api-errors';
import { PRICING } from '../../constants/pricing';
import { DIET_OPTIONS, CUISINE_OPTIONS, SERVING_SIZE_OPTIONS } from '../../constants/preferences';

describe('locales', () => {
  it('includes all 4 supported languages', () => {
    expect(locales).toContain('en');
    expect(locales).toContain('zh-CN');
    expect(locales).toContain('zh-TW');
    expect(locales).toContain('ja');
  });

  it('default locale is en', () => {
    expect(defaultLocale).toBe('en');
  });

  it('has display names for every locale', () => {
    for (const l of locales) {
      expect(localeNames[l]).toBeTruthy();
    }
  });
});

describe('apiError', () => {
  it('returns English for en locale', () => {
    expect(apiError('loginRequired', 'en')).toContain('log in');
  });

  it('returns Chinese for zh locale', () => {
    expect(apiError('loginRequired', 'zh-CN')).toContain('登录');
  });

  it('handles en- prefixed locales', () => {
    expect(apiError('userNotFound', 'en-US')).toBe(API_ERRORS.userNotFound.en);
  });

  it('returns key for invalid keys', () => {
    // @ts-expect-error - testing invalid key at runtime
    expect(apiError('no_such_key', 'en')).toBe('no_such_key');
  });
});

describe('PRICING', () => {
  it('has 4 plans with both currencies', () => {
    const plans = PRICING.plans;
    for (const period of ['monthly', 'quarterly', 'semiannual', 'annual'] as const) {
      expect(plans[period].cny.amount).toBeGreaterThan(0);
      expect(plans[period].usd.amount).toBeGreaterThan(0);
      expect(plans[period].cny.display).toBeTruthy();
    }
  });

  it('get() returns CNY by default', () => {
    expect(PRICING.get('monthly')).toBe(PRICING.plans.monthly.cny);
  });

  it('get() returns USD when requested', () => {
    expect(PRICING.get('annual', 'USD')).toBe(PRICING.plans.annual.usd);
  });

  it('annual plans cost less per period than monthly', () => {
    expect(PRICING.plans.annual.cny.amount).toBeLessThan(PRICING.plans.monthly.cny.amount * 12);
  });
});

describe('preferences', () => {
  it('has diet options', () => {
    expect(DIET_OPTIONS.length).toBeGreaterThan(3);
  });

  it('has cuisine options', () => {
    expect(CUISINE_OPTIONS.length).toBeGreaterThan(3);
  });

  it('has serving sizes 1-6', () => {
    expect(SERVING_SIZE_OPTIONS).toEqual([1, 2, 3, 4, 5, 6]);
  });
});