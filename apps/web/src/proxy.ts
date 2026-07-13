import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { locales, defaultLocale } from "@cookmate/shared/messages"

// ─── next-intl i18n middleware ───
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
})

// ─── Auth rate limiting ───
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 10
const ipHits = new Map<string, { count: number; resetAt: number }>()

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Rate limit auth endpoints
  if (path.startsWith("/api/auth/")) {
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

  // Skip API, static, and internal routes
  if (path.startsWith("/api/") || path.startsWith("/_next/") || path.startsWith("/_vercel") || path.includes(".")) {
    return NextResponse.next()
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
}