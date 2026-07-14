import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const LOCALES = ["zh-CN", "en"] as const
const DEFAULT_LOCALE = "zh-CN"

// Detect preferred locale from Accept-Language header
function detectLocale(acceptLang: string | null): string {
  if (!acceptLang) return DEFAULT_LOCALE
  const preferred = acceptLang.split(",").map((s) => s.split(";")[0].trim().toLowerCase())
  for (const lang of preferred) {
    if (lang.startsWith("zh")) return "zh-CN"
    if (lang.startsWith("en")) return "en"
  }
  return DEFAULT_LOCALE
}

// Rate limiting for auth endpoints
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 10
const ipHits = new Map<string, { count: number; resetAt: number }>()

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Rate limit auth endpoints ──
  if (pathname.startsWith("/api/auth/")) {
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

  // ── 2. Skip API, static, internal routes ──
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/_vercel") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // ── 3. Check if URL already has locale prefix ──
  for (const locale of LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      // Strip locale prefix and rewrite internally
      const newPath = pathname.replace(`/${locale}`, "") || "/"
      const url = request.nextUrl.clone()
      url.pathname = newPath
      const response = NextResponse.rewrite(url)
      response.cookies.set("NEXT_LOCALE", locale, {
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
      })
      return response
    }
  }

  // ── 4. No locale prefix: redirect to detected locale ──
  const detected = detectLocale(request.headers.get("accept-language"))
  const url = request.nextUrl.clone()
  url.pathname = `/${detected}${pathname === "/" ? "" : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
}