"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useTranslations } from "next-intl"
import { applyPref, CheckIcon, currentPref, MonitorIcon, MoonIcon, subscribeTheme, SunIcon, type ThemePref } from "@/components/ui/theme"

/**
 * 独立主题按钮（36px 方图标 + 向下弹出的三选一浮层），用于公开页导航栏 / 移动端顶栏。
 * App 侧边栏用的是头像下拉菜单里的「主题」二级子菜单，见 components/layout/Sidebar.tsx。
 *
 * ⚠️ 按钮上的图标由 CSS 的 .theme-opt-* 类驱动（跟着 <html class> 走），不用 JS 状态决定外观
 * —— 否则服务端不知道用户偏好、只能给默认值，水合后会跳一下。
 */
export default function ThemeToggle() {
  const t = useTranslations("nav")
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const pref = useSyncExternalStore(subscribeTheme, currentPref, (): ThemePref => "system")

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const options: { value: ThemePref; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t("themeLight"), icon: <SunIcon /> },
    { value: "dark", label: t("themeDark"), icon: <MoonIcon /> },
    { value: "system", label: t("themeSystem"), icon: <MonitorIcon /> },
  ]

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t("themeToggle")}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t("themeToggle")}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-accent hover:bg-surface transition-colors"
      >
        <span className="theme-opt theme-opt-icon theme-opt-system">
          <MonitorIcon />
        </span>
        <span className="theme-opt theme-opt-icon theme-opt-light">
          <SunIcon />
        </span>
        <span className="theme-opt theme-opt-icon theme-opt-dark">
          <MoonIcon />
        </span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 z-50 min-w-[150px] bg-card border border-border rounded-xl shadow-lg py-1.5 text-sm">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={pref === o.value}
              onClick={() => {
                applyPref(o.value)
                setOpen(false)
              }}
              className={
                "flex items-center gap-2.5 w-full px-3.5 py-2 text-left transition-colors " +
                (pref === o.value ? "text-accent bg-accent/10 font-medium" : "text-text-secondary hover:bg-surface hover:text-accent")
              }
            >
              <span className="shrink-0">{o.icon}</span>
              <span className="flex-1 truncate">{o.label}</span>
              {pref === o.value && (
                <span className="shrink-0">
                  <CheckIcon />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
