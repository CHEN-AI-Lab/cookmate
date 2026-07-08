"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { locales } from "@cookmate/shared/messages"
import { useTransition } from "react"

const labelMap: Record<string, string> = {
  "zh-CN": "中文",
  en: "English",
}

export default function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const toggleLocale = () => {
    const currentIndex = locales.indexOf(locale as (typeof locales)[number])
    const nextLocale = locales[(currentIndex + 1) % locales.length]

    // If the pathname already starts with the locale, replace it
    // Otherwise, prepend the new locale
    const segments = pathname.split("/").filter(Boolean)
    const first = segments[0]
    const hasLocale = locales.includes(first as (typeof locales)[number])

    let newPath: string
    if (hasLocale) {
      segments[0] = nextLocale
      newPath = "/" + segments.join("/")
    } else {
      newPath = "/" + nextLocale + pathname
    }

    startTransition(() => {
      router.replace(newPath)
    })
  }

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