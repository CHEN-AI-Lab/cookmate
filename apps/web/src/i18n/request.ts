import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { locales, defaultLocale } from "@cookmate/shared/messages"

export default getRequestConfig(async ({ requestLocale }) => {
  // Locale comes from the middleware (set via URL prefix like /en/...)
  const requested = await requestLocale
  const locale = hasLocale(locales, requested) ? requested : defaultLocale

  return {
    locale,
    messages: (await import(`@cookmate/shared/messages/${locale}.json`)).default,
  }
})