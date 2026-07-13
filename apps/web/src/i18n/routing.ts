import { createNavigation } from "next-intl/navigation"
import { defineRouting } from "next-intl/routing"

export const locales = ["zh-CN", "en"] as const
export const defaultLocale = "zh-CN"

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
})

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)