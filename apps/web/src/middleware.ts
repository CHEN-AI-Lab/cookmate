import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { locales, defaultLocale } from "@cookmate/shared/messages"

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true,
  localePrefix: "always",
})

// Rate limiting for auth endpoints
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 10
const ipHits = new Map<string, { count: number; resetAt: number }>()

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
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

  return intlMiddleware(request)
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
}