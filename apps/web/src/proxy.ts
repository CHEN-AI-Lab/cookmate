import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { routing } from "@/i18n/routing"
import { err, getLocaleFromCookie } from "@cookmate/shared/utils/locale"
import { hasDemoCookieHeader, isDemoWriteAllowed, isSafeMethod } from "@cookmate/shared/utils/demo-guard"
import { hasVerifiedSessionCookie } from "@/lib/session-cookie"

const intlMiddleware = createMiddleware(routing)

const RATE_LIMIT_WINDOW = 60_000
// NextAuth 一次正常登录会调用多个 /api/auth 端点（csrf/session/callback 等），阈值放宽避免误伤合法用户
const RATE_LIMIT_MAX = 30

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 体验模式统一拦截（默认拒绝写操作） ──
  // 「有体验 cookie 且没有可验证的真实登录会话」的请求，一切非安全方法一律 403。
  // 拦截集中在这一处：后续新增任何写接口都会自动受限，不需要再逐个路由补判断。
  // 白名单见 demo-guard.ts 的 DEMO_WRITE_ALLOWLIST_PREFIXES（目前只有 NextAuth 自身流程）。
  //
  // 体验态判定走真验签（hasVerifiedSessionCookie）：session cookie 若只看名字存在性，
  // 攻击者塞一个同名垃圾值就能让判定失效、绕过本拦截。路由层的 isDemoUser 守卫是第二道
  // 防线，但第一道也要尽可能把住。没有 demo cookie 的请求不进验签分支，真实用户零额外开销。
  const cookieHeader = request.headers.get("cookie")
  if (
    hasDemoCookieHeader(cookieHeader) &&
    !(await hasVerifiedSessionCookie(cookieHeader)) &&
    !isSafeMethod(request.method) &&
    !isDemoWriteAllowed(pathname)
  ) {
    const locale = getLocaleFromCookie(request as unknown as Request)
    return NextResponse.json(
      { error: err(locale, "demoReadOnly"), demoRestricted: true },
      { status: 403 },
    )
  }

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

  // 其余 /api 请求不参与国际化重写（此前 matcher 未覆盖 /api，行为保持一致）
  if (pathname.startsWith("/api/")) return NextResponse.next()

  return intlMiddleware(request)
}

export const config = {
  // 注意：/api/auth/:path* 必须在排除 api 的规则之前声明，否则 auth 限流永远不生效
  // /api/:path* 为体验模式守卫而加：需要拦住所有业务写接口
  matcher: ["/api/auth/:path*", "/api/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
}
