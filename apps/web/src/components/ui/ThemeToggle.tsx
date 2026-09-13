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

/** 订阅 <html> 的 class 变化 + 系统配色变化（仅供 aria-pressed 等无障碍状态使用） */
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
 * - variant="full"：带文案 + 开关（侧边栏）
 * - variant="icon"：纯图标（公开页导航栏 / 移动端顶栏）
 *
 * ⚠️ 视觉状态（图标、开关位置与颜色）**全部由 CSS 的 dark: 变体驱动**，跟着 <html class="dark"> 走。
 * 不要用 JS 状态去决定外观：SSR 阶段服务端不知道用户主题，只能给个默认值，
 * 水合后再改成真实值 —— 那样刷新时开关会「先关后开」跳一下（2026-09-13 用户反馈）。
 * 这里的 isDark 只用于 aria-pressed 等无障碍属性（不影响外观，晚一帧也无所谓）。
 */
export default function ThemeToggle({ variant = "full" }: { variant?: "full" | "icon" }) {
  const t = useTranslations("nav")
  const isDark = useSyncExternalStore(subscribe, currentIsDark, () => false)
  // 直接读 DOM 真实状态再取反，避免用到可能滞后一帧的 isDark
  const toggle = () => applyTheme(!currentIsDark())

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
        <span className="text-base leading-none dark:hidden">☀️</span>
        <span className="hidden text-base leading-none dark:inline">🌙</span>
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
      <span className="text-lg leading-none dark:hidden">☀️</span>
      <span className="hidden text-lg leading-none dark:inline">🌙</span>
      <span className="flex-1 truncate">{t("themeDark")}</span>
      {/* 开关：轨道配色与滑块位置都用 dark: 变体，SSR 首屏渲染出来即是正确状态 */}
      <span className="inline-flex w-9 h-5 shrink-0 rounded-full bg-border p-0.5 justify-start transition-colors dark:bg-accent dark:justify-end">
        <span className="h-4 w-4 rounded-full bg-white" />
      </span>
    </button>
  )
}
