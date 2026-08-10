import { NextResponse } from "next/server"
import { checkLoginRateLimit } from "@/lib/login-rate-limit"

// GET /api/auth/check-lockout?account=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const account = searchParams.get('account')
  if (!account) {
    return NextResponse.json({ error: 'missingAccount' }, { status: 400 })
  }

  const rateKey = `password:${account.toLowerCase()}`
  const check = checkLoginRateLimit(rateKey)

  if (!check.allowed) {
    const minutesRemaining = Math.ceil((check.lockedUntil! - Date.now()) / 60000)
    return NextResponse.json({
      locked: true,
      minutesRemaining,
      remaining: 0,
    })
  }

  return NextResponse.json({
    locked: false,
    remaining: check.remaining,
  })
}