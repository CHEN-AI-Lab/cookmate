"use client"

import { useSyncExternalStore } from "react"
import { useTranslations } from "next-intl"

const THEME_COOKIE = "theme"

/** 手动切主题：同步 <html> 上的 .dark/.light，并把选择写进 cookie（服务端下次直接渲染出来） */
function applyTheme(dark: boolean) {
  const el = document.documentElement
  el.classList.toggle("dark", dark)
  el.classList.toggle("light", !dark)
  // 写 cookie 而非 localStorage：root layout 能在 SSR 阶段读到并渲染进 <html class>，
  // 这样「切深色 → 刷新」首屏就是深色，绝不会先闪一下浅色。
  document.cookie =
    THEME_COOKIE + "=" + (dark ? "dark" : "light") + "; path=/; max-age=31536000; samesite=lax"
}

/** 当前实际生效的主题：优先看 <html> 上显式的 class，没有则跟随系统 */
function currentIsDark(): boolean {
  const el = document.documentElement
  if (el.classList.contains("dark")) return true
  if (el.classList.contains("light")) return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

/** 订阅 <html> 的 class 变化 + 系统配色变化，让图标始终反映真实主题 */
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  mq.addEventListener("change", callback)
  return () => {
    observer.disconnect()
    mq.removeEventListener("change", callback)
  }
}

/**
 * 主题切换按钮。
 * - variant="full"：带文案 + 开关（用于侧边栏）
 * - variant="icon"：纯图标（用于移动端顶栏）
 * 首屏由 root layout 读 cookie 把 .dark/.light 渲染进 <html>，刷新不闪色。
 */
export default function ThemeToggle({ variant = "full" }: { variant?: "full" | "icon" }) {
  const t = useTranslations("nav")
  const isDark = useSyncExternalStore(subscribe, currentIsDark, () => false)

  const toggle = () => applyTheme(!isDark)

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={t("themeToggle")}
        aria-pressed={isDark}
        title={t("themeToggle")}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface text-text-secondary hover:text-accent transition-colors"
      >
        <span className="text-base leading-none">{isDark ? "🌙" : "☀️"}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("themeToggle")}
      aria-pressed={isDark}
      title={t("themeToggle")}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors w-full text-left"
    >
      <span className="text-lg leading-none">{isDark ? "🌙" : "☀️"}</span>
      <span className="flex-1 truncate">{t("themeDark")}</span>
      <span
        className={"relative inline-flex w-9 h-5 shrink-0 rounded-full transition-colors " + (isDark ? "bg-accent" : "bg-border")}
      >
        <span
          className={"absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform " + (isDark ? "translate-x-4" : "translate-x-0.5")}
        />
      </span>
    </button>
  )
}
