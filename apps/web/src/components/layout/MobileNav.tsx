"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import LanguageSwitcher from "@/components/ui/LanguageSwitcher"

const navItems = [
  { href: "/app/dashboard", icon: "📊", labelKey: "dashboard" },
  { href: "/app/recipes", icon: "🍳", labelKey: "aiRecipes" },
  { href: "/app/my-recipes", icon: "📚", labelKey: "myRecipes" },
  { href: "/app/meal-plan", icon: "📅", labelKey: "mealPlan" },
  { href: "/app/grocery-list", icon: "🛒", labelKey: "groceryList" },
  { href: "/app/pantry", icon: "🥦", labelKey: "pantry" },
  { href: "/app/settings", icon: "⚙️", labelKey: "settings" },
]

export default function MobileNav() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("nav")

  const navigate = (href: string) => {
    window.location.href = `/${locale}${href}`
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 md:hidden z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "text-[#FF6B35]"
                  : "text-gray-500 hover:text-[#FF6B35]"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </button>
          )
        })}
        <LanguageSwitcher />
      </div>
    </nav>
  )
}