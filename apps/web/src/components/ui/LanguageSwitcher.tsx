"use client"

import { useLocale } from "next-intl"
import { locales } from "@cookmate/shared/messages"
import { useCallback } from "react"

const labelMap: Record<string, string> = {
  "zh-CN": "中文",
  en: "English",
}

export default function LanguageSwitcher() {
  const locale = useLocale()

  const toggleLocale = useCallback(() => {
    const currentIndex = locales.indexOf(locale as (typeof locales)[number])
    const nextLocale = locales[(currentIndex + 1) % locales.length]

    // Set cookie for next-intl to detect on next request
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`

    // Full page reload to ensure cookie is sent with the request
    window.location.reload()
  }, [locale])

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 text-gray-500 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
      title={locale === "zh-CN" ? "Switch to English" : "切换到中文"}
    >
      <span className="text-sm">
        {locale === "zh-CN" ? "🌐" : "🌏"}
      </span>
      <span>{labelMap[locale] || locale}</span>
    </button>
  )
}