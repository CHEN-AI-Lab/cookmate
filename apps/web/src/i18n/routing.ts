import { defineRouting } from "next-intl/routing"
import { locales, defaultLocale } from "@cookmate/shared/messages"

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
})