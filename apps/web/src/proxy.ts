import createMiddleware from "next-intl/middleware"
import { locales, defaultLocale } from "@cookmate/shared/messages"

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
})

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}