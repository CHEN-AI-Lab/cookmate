import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Simple IP-based rate limiting using headers
// Production: replace with Vercel KV or Upstash
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 10
const ipHits = new Map<string, { count: number; resetAt: number }>()

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Only rate limit auth endpoints
  if (!path.startsWith("/api/auth/")) return NextResponse.next()

  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
  const now = Date.now()
  const hit = ipHits.get(ip)

  if (!hit || now > hit.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return NextResponse.next()
  }

  hit.count++
  if (hit.count > RATE_LIMIT_MAX) {
    return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/auth/:path*",
}
