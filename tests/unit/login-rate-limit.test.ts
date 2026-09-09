import { describe, it, expect } from 'vitest'
import { checkLoginRateLimit, recordLoginAttempt } from '@cookmate/shared/utils/login-rate-limit'

// 注意: login-rate-limit 使用模块级 Map 存储状态，无法直接 reset。
// 每个测试使用唯一 key，避免互相干扰。
describe('login-rate-limit', () => {
  it('allows the first attempt', () => {
    const result = checkLoginRateLimit('root-test-key-1')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(5)
    expect(result.lockedUntil).toBeNull()
  })

  it('locks after 5 failed attempts', () => {
    const key = 'root-test-key-lock-' + Date.now()
    for (let i = 0; i < 5; i++) {
      recordLoginAttempt(key, false)
    }
    const result = checkLoginRateLimit(key)
    expect(result.allowed).toBe(false)
    expect(result.lockedUntil).not.toBeNull()
  })

  it('decrements remaining on failures', () => {
    const key = 'root-test-key-decr-' + Date.now()
    recordLoginAttempt(key, false)
    const result = checkLoginRateLimit(key)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('resets on successful login', () => {
    const key = 'root-test-key-reset-' + Date.now()
    recordLoginAttempt(key, false)
    recordLoginAttempt(key, false)
    recordLoginAttempt(key, true)
    const result = checkLoginRateLimit(key)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(5)
  })

  it('independently tracks different keys', () => {
    const keyA = 'root-test-key-a-' + Date.now()
    recordLoginAttempt(keyA, false)
    recordLoginAttempt(keyA, false)
    const resultA = checkLoginRateLimit(keyA)
    const resultB = checkLoginRateLimit('root-test-key-b-' + Date.now())
    expect(resultA.remaining).toBe(3)
    expect(resultB.remaining).toBe(5)
  })
})