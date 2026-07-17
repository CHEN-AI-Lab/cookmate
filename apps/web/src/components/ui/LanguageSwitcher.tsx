"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { locales, localeNames } from "@cookmate/shared/constants"
import { useCallback, useRef, useState, useEffect } from "react"

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
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const switchLocale = useCallback(
    (nextLocale: string) => {
      setOpen(false)
      if (isDemoUser && nextLocale !== "zh-CN" && nextLocale !== "en") {
        onDemoToast?.()
        return
      }
      router.push(pathname, { locale: nextLocale })
    },
    [pathname, router, isDemoUser, onDemoToast],
  )

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-[#FF6B35] hover:bg-orange-50 transition-colors"
        title="Language"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span className="hidden sm:inline">{localeNames[locale] || locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[120px] z-50">
          {locales.map((l) => {
            const active = l === locale
            return (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  active
                    ? "text-[#FF6B35] bg-orange-50 font-medium"
                    : "text-gray-600 hover:bg-orange-50 hover:text-[#FF6B35]"
                }`}
              >
                {localeNames[l] || l}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}