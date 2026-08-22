// Shared in-memory rate limiter for OTP / verification-code verification.
//
// This closes the OTP brute-force gap: previously, verify-code / verify-code-only
// / forgot-password endpoints had NO attempt limit, so a 6-digit code could be
// brute-forced. Now each identifier (phone/email) is locked out after MAX_ATTEMPTS
// failed verifications for LOCKOUT_DURATION.
//
// NOTE: in-memory state is per-process. For multi-instance / serverless deployments
// (e.g. Vercel) back this with a shared store (Redis or DB) so lockouts apply across
// instances. This mirrors the existing password login limiter (login-rate-limit.ts).

const otpAttempts = new Map<string, { count: number; lockedUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export function checkOtpRateLimit(key: string): { allowed: boolean; remaining: number; lockedUntil: number | null } {
  const now = Date.now()
  const entry = otpAttempts.get(key)
  if (entry) {
    if (entry.lockedUntil > now) {
      return { allowed: false, remaining: 0, lockedUntil: entry.lockedUntil }
    }
    // Lock expired — clear so the counter restarts.
    if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
      otpAttempts.delete(key)
    }
  }
  return { allowed: true, remaining: MAX_ATTEMPTS - (entry?.count || 0), lockedUntil: null }
}

export function recordOtpAttempt(key: string, success: boolean) {
  const now = Date.now()
  const entry = otpAttempts.get(key) || { count: 0, lockedUntil: 0 }
  if (success) {
    // Successful verification resets the counter.
    otpAttempts.delete(key)
    return
  }
  entry.count += 1
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION
  }
  otpAttempts.set(key, entry)
}
