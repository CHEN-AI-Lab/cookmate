"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

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

export function MobileNav() {
  const pathname = usePathname()
  const t = useTranslations("nav")

  return (
    <header className="fixed top-0 left-0 right-0 md:hidden bg-white border-b border-orange-100 h-16 z-50 flex items-center justify-between px-4">
      {/* Left: Logo */}
      <Link href="/app/dashboard" className="flex items-center gap-2">
        <span className="text-xl">🍳</span>
        <span className="text-base font-bold text-[#2D3436]">CookMate</span>
      </Link>

      {/* Right: Icon-only nav links */}
      <nav className="flex items-center gap-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-colors ${
                isActive
                  ? "text-[#FF6B35]"
                  : "text-gray-400 hover:text-[#FF6B35]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium leading-tight">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>
    </header>
  )
}