"use client"

export type ThemePref = "light" | "dark" | "system"

/** 当前偏好：<html> 上有 .light/.dark 说明是显式选择，都没有则是「跟随系统」 */
export function currentPref(): ThemePref {
  const el = document.documentElement
  if (el.classList.contains("light")) return "light"
  if (el.classList.contains("dark")) return "dark"
  return "system"
}

/** 切换偏好：同步 <html> 的 class，并把选择写进 cookie（服务端下次直接渲染出来） */
export function applyPref(pref: ThemePref) {
  const el = document.documentElement
  el.classList.toggle("dark", pref === "dark")
  el.classList.toggle("light", pref === "light")
  // 写 cookie 而非 localStorage：root layout 在 SSR 阶段读到 light/dark 会直接渲染进
  // <html class>，刷新首屏就是正确主题；值为 system 时不加 class，交给媒体查询跟随系统。
  document.cookie = "theme=" + pref + "; path=/; max-age=31536000; samesite=lax"
}

/** 订阅 <html> 的 class 变化 + 系统配色变化（用于判断当前选中项） */
export function subscribeTheme(cb: () => void) {
  const observer = new MutationObserver(cb)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  mq.addEventListener("change", cb)
  return () => {
    observer.disconnect()
    mq.removeEventListener("change", cb)
  }
}

/** 浅色。单色线性图标，stroke=currentColor 可跟随文字色（不用 emoji：emoji 无法改色） */
export function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5.05 5.05l1.77 1.77M17.18 17.18l1.77 1.77M18.95 5.05l-1.77 1.77M6.82 17.18l-1.77 1.77" />
    </svg>
  )
}

/** 深色 */
export function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  )
}

/** 跟随系统 */
export function MonitorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  )
}

/** 选中打勾 */
export function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  )
}
