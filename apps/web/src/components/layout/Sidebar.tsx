"use client"

import { Link } from "@/i18n/navigation"
import { useRouter } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { useState, useRef, useEffect } from "react"
import { locales } from "@cookmate/shared/constants"
import LanguageSwitcher from "@/components/ui/LanguageSwitcher"

const navItems = [
  { href: "/app/dashboard", icon: "📊", labelKey: "dashboard" },
  { href: "/app/recipes", icon: "🍳", labelKey: "aiRecipes" },
  { href: "/app/my-recipes", icon: "📚", labelKey: "myRecipes" },
  { href: "/app/meal-plan", icon: "📅", labelKey: "mealPlan" },
  { href: "/app/grocery-list", icon: "🛒", labelKey: "groceryList" },
  { href: "/app/pantry", icon: "🥦", labelKey: "pantry" },
  { href: "/app/billing", icon: "💳", labelKey: "billing" },
]

export function Sidebar({
  name,
  isDemoUser,
}: {
  name?: string | undefined | null
  isDemoUser?: boolean
}) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("nav")
  const initial = name?.charAt(0)?.toUpperCase() || "?"

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-orange-100 h-screen sticky top-0">
      {/* Logo */}
      <Link
        href="/app/dashboard"
        className="flex items-center gap-2 px-6 h-16 border-b border-orange-100"
      >
        <span className="text-2xl">🍳</span>
        <span className="text-xl font-bold text-[#2D3436]">CookMate</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-100 text-[#FF6B35]"
                  : "text-gray-600 hover:bg-orange-50 hover:text-[#FF6B35]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: user menu dropdown */}
      <div className="px-3 py-3 border-t border-orange-100">
        {name ? (
          <UserMenu name={name} initial={initial} t={t} isDemoUser={isDemoUser} />
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors w-full text-left font-medium"
          >
            <span className="flex items-center justify-center w-7 h-7 shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span>{t("logout")}</span>
          </button>
        )}
      </div>
    </aside>
  )
}

function UserMenu({ name, initial, t, isDemoUser }: { name: string; initial: string; t: (key: string) => string; isDemoUser?: boolean }) {
  const [open, setOpen] = useState(false)
  const [demoLangToast, setDemoLangToast] = useState("")
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const locale = useLocale()

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const toggleLanguage = () => {
    if (isDemoUser) {
      const nextLocale = locale === "zh-CN" ? "en" : "zh-CN"
      setDemoLangToast(t("demoLangToast"))
      setTimeout(() => setDemoLangToast(""), 4000)
      const pathWithoutLocale = window.location.pathname.replace(
        new RegExp(`^/(${locales.join("|")})(/|$)`), "/"
      )
      router.push(pathWithoutLocale || "/", { locale: nextLocale })
      return
    }
    const nextLocale = locales[(locales.indexOf(locale as (typeof locales)[number]) + 1) % locales.length]
    const pathWithoutLocale = window.location.pathname.replace(
      new RegExp(`^/(${locales.join("|")})(/|$)`), "/"
    )
    router.push(pathWithoutLocale || "/", { locale: nextLocale })
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 w-full text-left transition-colors"
      >
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-[#FF6B35] text-xs font-bold shrink-0">
          {initial}
        </span>
        <span className="truncate flex-1">{isDemoUser && (locale === "en" || locale.startsWith("en")) ? "Demo User" : name}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-orange-100 rounded-xl shadow-lg py-1.5 text-sm">
          <Link
            href="/app/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-gray-600 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
          >
            <span className="text-base">⚙️</span>
            <span>{t("settings")}</span>
          </Link>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2.5 px-4 py-2 text-gray-600 hover:bg-orange-50 hover:text-[#FF6B35] w-full text-left transition-colors"
          >
            <span className="text-base">🌐</span>
            <span>{locale === "zh-CN" ? "English" : "中文"}</span>
          </button>
          <div className="border-t border-orange-100 my-1" />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2.5 px-4 py-2 text-gray-500 hover:bg-orange-50 hover:text-red-500 w-full text-left transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{t("logout")}</span>
          </button>
        </div>
      )}
      {demoLangToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs shadow-lg z-[100] whitespace-nowrap">
          {demoLangToast}
        </div>
      )}
    </div>
  )
}