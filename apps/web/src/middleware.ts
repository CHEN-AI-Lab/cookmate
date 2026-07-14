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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API, static, internal routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/_vercel") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Check if URL already has locale prefix
  for (const locale of LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
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

  // No locale prefix: redirect to detected locale
  const detected = detectLocale(request.headers.get("accept-language"))
  const url = request.nextUrl.clone()
  url.pathname = `/${detected}${pathname === "/" ? "" : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
}