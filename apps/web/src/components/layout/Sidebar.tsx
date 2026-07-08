"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "@/components/ui/LanguageSwitcher"

const navItems = [
  { href: "/app/dashboard", icon: "📊", labelKey: "dashboard" },
  { href: "/app/recipes", icon: "🍳", labelKey: "aiRecipes" },
  { href: "/app/my-recipes", icon: "📚", labelKey: "myRecipes" },
  { href: "/app/meal-plan", icon: "📅", labelKey: "mealPlan" },
  { href: "/app/grocery-list", icon: "🛒", labelKey: "groceryList" },
  { href: "/app/pantry", icon: "🥦", labelKey: "pantry" },
  { href: "/app/settings", icon: "⚙️", labelKey: "settings" },
  { href: "/app/billing", icon: "💳", labelKey: "billing" },
]

export function Sidebar({
  name,
}: {
  name?: string | undefined | null
}) {
  const pathname = usePathname()
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

      {/* Bottom: user info + logout */}
      <div className="px-3 py-3 border-t border-orange-100">
        <div className="px-3 py-1.5 flex justify-end">
          <LanguageSwitcher />
        </div>
        {name ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 group">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-[#FF6B35] text-xs font-bold shrink-0">
              {initial}
            </span>
            <span className="truncate flex-1">{name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors shrink-0"
              title={t("logout")}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
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