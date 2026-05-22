"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

const navItems = [
  { href: "/app/dashboard", label: "仪表盘", icon: "📊" },
  { href: "/app/recipes", label: "AI 菜谱", icon: "🍳" },
  { href: "/app/my-recipes", label: "我的菜谱", icon: "📚" },
  { href: "/app/meal-plan", label: "周计划", icon: "📅" },
  { href: "/app/grocery-list", label: "购物清单", icon: "🛒" },
  { href: "/app/pantry", label: "食材库", icon: "🥦" },
  { href: "/app/settings", label: "设置", icon: "⚙️" },
]

export function Sidebar({ email }: { email: string | undefined | null }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-orange-100 p-6 hidden md:flex flex-col">
      <Link href="/app/dashboard" className="flex items-center gap-2 mb-8">
        <span className="text-2xl">🍳</span>
        <span className="text-lg font-bold text-[#2D3436]">CookMate</span>
      </Link>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-orange-100 text-[#FF6B35] shadow-sm"
                  : "text-gray-600 hover:bg-orange-50 hover:text-[#FF6B35]"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">{email}</p>
        <Link href="/api/auth/signout" className="text-xs text-[#FF6B35] hover:underline">退出登录</Link>
      </div>
    </aside>
  )
}

export function MobileNav() {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-orange-100 z-50 h-16 flex items-center px-4">
      <Link href="/app/dashboard" className="flex items-center gap-2">
        <span className="text-2xl">🍳</span>
        <span className="text-lg font-bold">CookMate</span>
      </Link>
      <div className="ml-auto flex gap-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="text-xl p-1">{item.icon}</Link>
        ))}
      </div>
    </div>
  )
}