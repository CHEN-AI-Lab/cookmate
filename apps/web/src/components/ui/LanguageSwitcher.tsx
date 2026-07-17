"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { locales, localeNames } from "@cookmate/shared/constants"
import { useCallback } from "react"

export default function LanguageSwitcher({
  isDemoUser,
  onDemoToast,
}: {
  isDemoUser?: boolean
  onDemoToast?: () => void
}) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const nextLocale = e.target.value
      if (isDemoUser && nextLocale !== "zh-CN" && nextLocale !== "en") {
        onDemoToast?.()
        return
      }
      router.push(pathname, { locale: nextLocale })
    },
    [pathname, router, isDemoUser, onDemoToast],
  )

  return (
    <select
      value={locale}
      onChange={handleChange}
      className="appearance-none bg-transparent border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-[#FF6B35] hover:border-[#FF6B35] cursor-pointer transition-colors outline-none"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l] || l}
        </option>
      ))}
    </select>
  )
}