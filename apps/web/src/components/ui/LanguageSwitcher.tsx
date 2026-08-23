"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { locales, localeNames } from "@cookmate/shared/constants"
import { useCallback, useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"

export default function LanguageSwitcher({
  isDemoUser,
}: {
  isDemoUser?: boolean
}) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState(() => {
    if (typeof window === "undefined") return ""
    const saved = sessionStorage.getItem("demoLangToast")
    if (saved) {
      sessionStorage.removeItem("demoLangToast")
      return saved
    }
    return ""
  })
  const ref = useRef<HTMLDivElement>(null)

  // Auto-dismiss toast after 2.5s
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(""), 2500)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Filter locales for demo users: only zh-CN and en
  const visibleLocales = isDemoUser
    ? (locales as readonly string[]).filter((l) => l === "zh-CN" || l === "en")
    : locales

  const switchLocale = useCallback(
    (nextLocale: string) => {
      setOpen(false)
      if (isDemoUser && nextLocale !== "zh-CN" && nextLocale !== "en") return
      if (isDemoUser) {
        const msg = nextLocale === "zh-CN"
          ? "体验用户只能在中文和英文间切换"
          : "Demo users can only switch between Chinese and English"
        setToast(msg)
        sessionStorage.setItem("demoLangToast", msg)
        setTimeout(() => { setToast(""); sessionStorage.removeItem("demoLangToast") }, 2500)
      }
      router.push(pathname, { locale: nextLocale })
    },
    [pathname, router, isDemoUser],
  )

  return (
    <>
    <div ref={ref} className="relative inline-block">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-accent hover:bg-surface transition-colors"
          title={localeNames[locale] || locale}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 bg-card border border-gray-100 rounded-xl shadow-lg py-1 min-w-[100px] z-50">
            {visibleLocales.map((l) => {
              const active = l === locale
              return (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    active
                      ? "text-accent bg-orange-50 font-medium"
                      : "text-text-secondary hover:bg-surface hover:text-accent"
                  }`}
                >
                  {localeNames[l] || l}
                </button>
              )
            })}
          </div>
        )}
      </div>
      {toast && typeof document !== "undefined" && createPortal(
        /* Centered toast — floats in middle of screen, auto-dismisses 2.5s */
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[99999]">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-5 py-3 rounded-xl text-sm shadow-lg">
            {toast}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}