import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { routing } from "@/i18n/routing"
import { err, getLocaleFromCookie } from "@cookmate/shared/utils/locale"

const intlMiddleware = createMiddleware(routing)

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 10

// 使用全局变量，在 Vercel warm start 时保留状态
// 注意：多实例部署仍可能不共享，生产环境建议用 Redis
const globalForRateLimit = globalThis as typeof globalThis & {
  ipHits?: Map<string, { count: number; resetAt: number }>
}
if (!globalForRateLimit.ipHits) {
  globalForRateLimit.ipHits = new Map()
}
const ipHits = globalForRateLimit.ipHits

// 定期清理过期记录，防止内存泄漏
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 5 * 60_000
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [ip, hit] of ipHits) {
    if (now > hit.resetAt) ipHits.delete(ip)
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/auth/")) {
    cleanup()

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown"
    const now = Date.now()
    const hit = ipHits.get(ip)

    if (!hit || now > hit.resetAt) {
      ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
      const res = NextResponse.next()
      res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX))
      res.headers.set("X-RateLimit-Remaining", String(RATE_LIMIT_MAX - 1))
      res.headers.set("X-RateLimit-Reset", String(Math.ceil((now + RATE_LIMIT_WINDOW) / 1000)))
      return res
    }

    hit.count++
    if (hit.count > RATE_LIMIT_MAX) {
      const locale = getLocaleFromCookie(request as unknown as Request)
      const res = NextResponse.json(
        { error: err(locale, "rateLimitExceeded") },
        { status: 429 }
      )
      res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX))
      res.headers.set("X-RateLimit-Remaining", "0")
      res.headers.set("X-RateLimit-Reset", String(Math.ceil(hit.resetAt / 1000)))
      res.headers.set("Retry-After", String(Math.ceil((hit.resetAt - now) / 1000)))
      return res
    }

    const res = NextResponse.next()
    res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX))
    res.headers.set("X-RateLimit-Remaining", String(RATE_LIMIT_MAX - hit.count))
    res.headers.set("X-RateLimit-Reset", String(Math.ceil(hit.resetAt / 1000)))
    return res
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
