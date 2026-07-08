"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

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

export function Sidebar({
  name,
}: {
  name?: string | undefined | null
}) {
  const pathname = usePathname()
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
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: user info + logout */}
      <div className="px-3 py-3 border-t border-orange-100">
        {name ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 group">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-[#FF6B35] text-xs font-bold shrink-0">
              {initial}
            </span>
            <span className="truncate flex-1">{name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors shrink-0"
              title="退出登录"
            >
              <span className="text-base">🚪</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors w-full text-left font-medium"
          >
            <span className="flex items-center justify-center w-7 h-7 shrink-0 text-base">🚪</span>
            <span>退出登录</span>
          </button>
        )}
      </div>
    </aside>
  )
}