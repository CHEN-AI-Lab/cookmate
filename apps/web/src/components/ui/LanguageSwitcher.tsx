"use client"

import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { locales } from "@cookmate/shared/messages"
import { useTransition, useCallback } from "react"

const labelMap: Record<string, string> = {
  "zh-CN": "中文",
  en: "English",
}

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const toggleLocale = useCallback(() => {
    const currentIndex = locales.indexOf(locale as (typeof locales)[number])
    const nextLocale = locales[(currentIndex + 1) % locales.length]

    // Set cookie for next-intl middleware (localePrefix: 'never')
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`

    startTransition(() => {
      router.refresh()
    })
  }, [locale, router])

  return (
    <button
      onClick={toggleLocale}
      disabled={isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 text-gray-500 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors disabled:opacity-50"
      title={locale === "zh-CN" ? "Switch to English" : "切换到中文"}
    >
      <span className="text-sm">
        {locale === "zh-CN" ? "🌐" : "🌏"}
      </span>
      <span>{labelMap[locale] || locale}</span>
    </button>
  )
}