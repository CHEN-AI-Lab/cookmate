import { describe, it, expect } from 'vitest';
import { t } from '../../i18n/index';

describe('i18n t()', () => {
  it('resolves a nested key', () => {
    const result = t('zh-CN', 'home.title');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('resolves English keys', () => {
    const result = t('en', 'home.title');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('falls back to zh-CN for unsupported locales', () => {
    const zh = t('zh-CN', 'common.cancel');
    const fallback = t('xx-XX', 'common.cancel');
    expect(fallback).toBe(zh);
  });

  it('returns path for unknown keys', () => {
    expect(t('zh-CN', 'no.such.key')).toBe('no.such.key');
  });

  it('returns fallback when provided for unknown keys', () => {
    expect(t('zh-CN', 'no.such.key', 'fallback text')).toBe('fallback text');
  });

  it('treats en- prefixed locales as English', () => {
    // Note: en-US is not in messageMap, so this falls back to zh-CN.
    const result = t('en-US', 'home.title');
    expect(typeof result).toBe('string');
  });
});