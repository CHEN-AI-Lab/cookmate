"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/app/dashboard", icon: "📊", label: "仪表盘" },
  { href: "/app/recipes", icon: "🍳", label: "AI菜谱" },
  { href: "/app/my-recipes", icon: "📚", label: "我的菜谱" },
  { href: "/app/meal-plan", icon: "📅", label: "周计划" },
  { href: "/app/grocery-list", icon: "🛒", label: "购物清单" },
  { href: "/app/pantry", icon: "🥦", label: "食材库" },
  { href: "/app/settings", icon: "⚙️", label: "设置" },
  { href: "/app/billing", icon: "💳", label: "账单" },
]

export function MobileNav() {
  const pathname = usePathname()

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
              className={`text-lg transition-colors ${
                isActive ? "text-[#FF6B35]" : "text-gray-500 hover:text-[#FF6B35]"
              }`}
              title={item.label}
            >
              {item.icon}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}