"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { locales } from "@cookmate/shared/constants"
import { useCallback } from "react"

const labelMap: Record<string, string> = {
  "zh-CN": "EN",
  en: "中",
}

export default function LanguageSwitcher({
  isDemoUser,
}: {
  isDemoUser?: boolean
}) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const toggleLocale = useCallback(() => {
    if (isDemoUser) {
      // Demo users: only toggle between zh-CN and en
      const nextLocale = locale === "zh-CN" ? "en" : "zh-CN"
      router.push(pathname, { locale: nextLocale })
      return
    }
    const currentIndex = locales.indexOf(locale as (typeof locales)[number])
    const nextLocale = locales[(currentIndex + 1) % locales.length]
    router.push(pathname, { locale: nextLocale })
  }, [locale, pathname, router, isDemoUser])

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-[#FF6B35] hover:bg-orange-50 transition-colors"
      title={locale === "zh-CN" ? "English" : "中文"}
    >
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <span>{labelMap[locale] || locale}</span>
    </button>
  )
}