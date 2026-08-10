// Shared in-memory rate limiter for password login
// Used by both auth.ts (Credentials provider) and check-lockout API

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export function checkLoginRateLimit(key: string): { allowed: boolean; remaining: number; lockedUntil: number | null } {
  const now = Date.now()
  const entry = loginAttempts.get(key)
  if (entry) {
    if (entry.lockedUntil > now) {
      return { allowed: false, remaining: 0, lockedUntil: entry.lockedUntil }
    }
    if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
      loginAttempts.delete(key)
    }
  }
  return { allowed: true, remaining: MAX_ATTEMPTS - (entry?.count || 0), lockedUntil: null }
}

export function recordLoginAttempt(key: string, success: boolean) {
  const now = Date.now()
  const entry = loginAttempts.get(key) || { count: 0, lockedUntil: 0 }
  if (success) {
    loginAttempts.delete(key)
    return
  }
  entry.count += 1
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION
  }
  loginAttempts.set(key, entry)
}