import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const LOCALES = ["zh-CN", "en"] as const
const DEFAULT_LOCALE = "zh-CN"

function detectLocale(acceptLang: string | null): string {
  if (!acceptLang) return DEFAULT_LOCALE
  const preferred = acceptLang.split(",").map((s) => s.split(";")[0].trim().toLowerCase())
  for (const lang of preferred) {
    if (lang.startsWith("zh")) return "zh-CN"
    if (lang.startsWith("en")) return "en"
  }
  return DEFAULT_LOCALE
}

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 10
const ipHits = new Map<string, { count: number; resetAt: number }>()

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limit auth endpoints
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

  // Skip API, static, internal routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/_vercel") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Extract locale from URL path (e.g., /en/about → en)
  let locale = DEFAULT_LOCALE
  for (const l of LOCALES) {
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) {
      locale = l
      break
    }
  }

  // Set x-next-intl-locale header so getRequestConfig can read it
  const response = NextResponse.next()
  response.headers.set("x-next-intl-locale", locale)

  // If no locale prefix, redirect to detected locale
  if (!LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) {
    const detected = detectLocale(request.headers.get("accept-language"))
    const url = request.nextUrl.clone()
    url.pathname = `/${detected}${pathname === "/" ? "" : pathname}`
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
}