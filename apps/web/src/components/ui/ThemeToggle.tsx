"use client"

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { useTranslations } from "next-intl"

type ThemePref = "light" | "dark" | "system"

/** 当前偏好：<html> 上有 .light/.dark 说明是显式选择，都没有则是「跟随系统」 */
function currentPref(): ThemePref {
  const el = document.documentElement
  if (el.classList.contains("light")) return "light"
  if (el.classList.contains("dark")) return "dark"
  return "system"
}

/** 切换偏好：同步 <html> 的 class 并把选择写进 cookie（服务端下次直接渲染出来） */
function applyPref(pref: ThemePref) {
  const el = document.documentElement
  el.classList.toggle("dark", pref === "dark")
  el.classList.toggle("light", pref === "light")
  // 写 cookie 而非 localStorage：root layout 在 SSR 阶段读到 light/dark 会直接渲染进
  // <html class>，刷新首屏就是正确主题；值为 system 时不加 class，交给媒体查询跟随系统。
  document.cookie = "theme=" + pref + "; path=/; max-age=31536000; samesite=lax"
}

/** 订阅 <html> 的 class 变化 + 系统配色变化（下拉里的「当前项」勾选状态用） */
function subscribe(cb: () => void) {
  const observer = new MutationObserver(cb)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  mq.addEventListener("change", cb)
  return () => {
    observer.disconnect()
    mq.removeEventListener("change", cb)
  }
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5.05 5.05l1.77 1.77M17.18 17.18l1.77 1.77M18.95 5.05l-1.77 1.77M6.82 17.18l-1.77 1.77" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  )
}

function MonitorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/**
 * 主题切换：图标按钮 + 三选一下拉（浅色 / 深色 / 跟随系统）。
 * - variant="full"：侧边栏用的整行触发器（图标 + 当前模式 + 箭头）
 * - variant="icon"：公开页导航栏 / 移动端顶栏用的方图标按钮
 *
 * ⚠️ 触发按钮上的图标与文字**全部由 CSS 的 light:/dark: 变体驱动**（跟着 <html class> 走），
 * 不用 JS 状态决定外观 —— 否则服务端不知道用户偏好、只能给默认值，水合后跳一下。
 * JS 状态（pref）只用于下拉里「当前项」的勾选高亮，下拉是点开后才渲染的，不存在首屏跳动。
 */
export default function ThemeToggle({ variant = "full" }: { variant?: "full" | "icon" }) {
  const t = useTranslations("nav")
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const pref = useSyncExternalStore(subscribe, currentPref, (): ThemePref => "system")

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

  const options: { value: ThemePref; label: string; icon: ReactNode }[] = [
    { value: "light", label: t("themeLight"), icon: <SunIcon /> },
    { value: "dark", label: t("themeDark"), icon: <MoonIcon /> },
    { value: "system", label: t("themeSystem"), icon: <MonitorIcon /> },
  ]

  const menu = open ? (
    <div
      role="menu"
      className={
        "absolute z-50 min-w-[150px] bg-card border border-border rounded-xl shadow-lg py-1.5 text-sm " +
        (variant === "icon" ? "right-0 top-full mt-2" : "bottom-full left-0 mb-1 w-full")
      }
    >
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
  ) : null

  if (variant === "icon") {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={t("themeToggle")}
          aria-haspopup="menu"
          aria-expanded={open}
          title={t("themeToggle")}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-surface text-text-secondary hover:text-accent transition-colors"
        >
          <span className="inline-flex light:hidden dark:hidden">
            <MonitorIcon />
          </span>
          <span className="hidden light:inline-flex">
            <SunIcon />
          </span>
          <span className="hidden dark:inline-flex">
            <MoonIcon />
          </span>
        </button>
        {menu}
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t("themeToggle")}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t("themeToggle")}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors w-full text-left"
      >
        <span className="inline-flex shrink-0 light:hidden dark:hidden">
          <MonitorIcon />
        </span>
        <span className="hidden shrink-0 light:inline-flex">
          <SunIcon />
        </span>
        <span className="hidden shrink-0 dark:inline-flex">
          <MoonIcon />
        </span>
        <span className="flex-1 truncate">
          <span className="light:hidden dark:hidden">{t("themeSystem")}</span>
          <span className="hidden light:inline">{t("themeLight")}</span>
          <span className="hidden dark:inline">{t("themeDark")}</span>
        </span>
        <span className={"shrink-0 transition-transform " + (open ? "rotate-180" : "")}>
          <ChevronIcon />
        </span>
      </button>
      {menu}
    </div>
  )
}
