import { describe, it, expect, beforeEach } from 'vitest';
import { checkLoginRateLimit, recordLoginAttempt } from '../../utils/login-rate-limit';

describe('login-rate-limit', () => {
  beforeEach(() => {
    // Clean up state by succeeding to reset - module-level Map can't be reset directly,
    // so use unique keys per test.
  });

  it('allows the first attempt', () => {
    const result = checkLoginRateLimit('test-key-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
    expect(result.lockedUntil).toBeNull();
  });

  it('locks after 5 failed attempts', () => {
    const key = 'test-key-lock-' + Date.now();
    for (let i = 0; i < 5; i++) {
      recordLoginAttempt(key, false);
    }
    const result = checkLoginRateLimit(key);
    expect(result.allowed).toBe(false);
    expect(result.lockedUntil).not.toBeNull();
  });

  it('decrements remaining on failures', () => {
    const key = 'test-key-decr-' + Date.now();
    recordLoginAttempt(key, false);
    const result = checkLoginRateLimit(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('resets on successful login', () => {
    const key = 'test-key-reset-' + Date.now();
    recordLoginAttempt(key, false);
    recordLoginAttempt(key, false);
    recordLoginAttempt(key, true);
    const result = checkLoginRateLimit(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it('independently tracks different keys', () => {
    const keyA = 'test-key-a-' + Date.now();
    recordLoginAttempt(keyA, false);
    recordLoginAttempt(keyA, false);
    const resultA = checkLoginRateLimit(keyA);
    const resultB = checkLoginRateLimit('test-key-b-' + Date.now());
    expect(resultA.remaining).toBe(3);
    expect(resultB.remaining).toBe(5);
  });
});