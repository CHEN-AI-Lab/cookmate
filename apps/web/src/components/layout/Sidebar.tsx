"use client"

import { Link } from "@/i18n/navigation"
import { useRouter } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { useState, useRef, useEffect, useLayoutEffect, useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"
import {
  isNavActive,
  locales,
  localeNames,
  NAV_ACCOUNT_LINKS,
  NAV_ADMIN_ITEM,
  NAV_ITEMS,
} from "@cookmate/shared/constants"
import { isChineseLocale } from "@cookmate/shared/constants/locales"
import { useToast } from "@/components/ui/Toast"
import { SUPPORT_EMAIL } from "@cookmate/shared/constants/support-email"
import { GearIcon, GlobeIcon, LogoutIcon, MailIcon } from "@/components/ui/nav-icons"
import {
  applyPref,
  CheckIcon,
  currentPref,
  MonitorIcon,
  MoonIcon,
  subscribeTheme,
  SunIcon,
  type ThemePref,
} from "@/components/ui/theme"

// 导航项来自 shared/constants/nav.ts（桌面端 / 移动端 / 将来的小程序共用一份）。
// 禁止在本文件里再写一份列表 —— 历史上就因为两端各写一份，
// 「我的菜谱 / AI菜谱」调换顺序只改了桌面端、手机端没跟上。
const navItems = NAV_ITEMS

export function Sidebar({
  name,
  isDemoUser,
  isAdmin,
}: {
  name?: string | undefined | null
  isDemoUser?: boolean
  isAdmin?: boolean
}) {
  const pathname = usePathname()
  const t = useTranslations("nav")
  const initial = name?.charAt(0)?.toUpperCase() || "?"
  const { showToast } = useToast()
  const copySupportEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      showToast(t("supportCopied", { email: SUPPORT_EMAIL }))
    } catch {
      showToast(t("supportCopied", { email: SUPPORT_EMAIL }))
    }
  }

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <Link
        href="/app/dashboard"
        className="flex items-center gap-2 px-6 h-16 border-b border-border"
      >
        <span className="text-2xl">🍳</span>
        <span className="text-xl font-bold text-text-primary">CookMate</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = isNavActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-accent/10 hover:text-accent"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            href={NAV_ADMIN_ITEM.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isNavActive(pathname, NAV_ADMIN_ITEM.href)
                ? "bg-accent/10 text-accent"
                : "text-text-secondary hover:bg-accent/10 hover:text-accent"
            }`}
          >
            <span className="text-lg">{NAV_ADMIN_ITEM.icon}</span>
            <span className="truncate">{NAV_ADMIN_ITEM.label}</span>
          </Link>
        )}
      </nav>

      {/* Bottom: user menu dropdown（主题切换在下拉菜单里） */}
      <div className="px-3 py-3 border-t border-border">
        {/* 支持邮箱（Creem 要求应用内可见） */}
        <button
          type="button"
          onClick={copySupportEmail}
          title={SUPPORT_EMAIL}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-accent/10 hover:text-accent transition-colors font-medium cursor-pointer w-full text-left"
        >
          <span className="flex items-center justify-center w-7 h-7 shrink-0">
            <MailIcon />
          </span>
          <span>{t("support")}</span>
        </button>
        {name ? (
          <UserMenu name={name} initial={initial} t={t} isDemoUser={isDemoUser} />
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-surface hover:text-accent transition-colors w-full text-left font-medium"
          >
            <span className="flex items-center justify-center w-7 h-7 shrink-0">
              <LogoutIcon />
            </span>
            <span>{t("logout")}</span>
          </button>
        )}
      </div>
    </aside>
  )
}

// GearIcon / GlobeIcon 已移到 @/components/ui/nav-icons（移动端导航也要用，抽出去共用一份）

function UserMenu({ name, initial, t, isDemoUser }: { name: string; initial: string; t: (key: string) => string; isDemoUser?: boolean }) {
  const [open, setOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [demoLangToast, setDemoLangToast] = useState(() => {
    if (typeof window === "undefined") return ""
    const saved = sessionStorage.getItem("demoLangToast")
    if (saved) {
      sessionStorage.removeItem("demoLangToast")
      return saved
    }
    return ""
  })
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  // 语言子菜单 portal 到 body：按钮 ref 用于测量弹出位置，子菜单 ref 用于点击外部判定
  const langBtnRef = useRef<HTMLButtonElement>(null)
  const submenuRef = useRef<HTMLDivElement>(null)
  const [langPos, setLangPos] = useState<{ top: number; left: number } | null>(null)
  // 主题子菜单与语言同样 portal 到 body（按钮 ref 测量位置，子菜单 ref 参与点击外部判定）
  const themeBtnRef = useRef<HTMLButtonElement>(null)
  const themeSubmenuRef = useRef<HTMLDivElement>(null)
  const [themePos, setThemePos] = useState<{ top: number; left: number } | null>(null)
  const pref = useSyncExternalStore(subscribeTheme, currentPref, (): ThemePref => "system")
  const locale = useLocale()

  // Auto-dismiss toast after 2.5s
  useEffect(() => {
    if (!demoLangToast) return
    const timer = setTimeout(() => setDemoLangToast(""), 2500)
    return () => clearTimeout(timer)
  }, [demoLangToast])

  // 语言子菜单打开时，按钮位置测量 → 决定 portal 的 fixed 坐标；
  // 关闭时清空坐标（避免下次打开瞬间用到旧值）。
  useLayoutEffect(() => {
    if (langOpen && langBtnRef.current) {
      const r = langBtnRef.current.getBoundingClientRect()
      setLangPos({ top: r.top, left: r.right + 8 })
    } else {
      setLangPos(null)
    }
  }, [langOpen])

  // 子菜单打开期间，滚动 / 缩放窗口会让 fixed 坐标失效 → 直接关闭
  useEffect(() => {
    if (!langOpen) return
    const close = () => { setLangOpen(false); setLangPos(null) }
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [langOpen])

  // 主题子菜单：与语言完全相同的展开方式（测量按钮位置 → portal 到 body 右侧）
  useLayoutEffect(() => {
    if (themeOpen && themeBtnRef.current) {
      const r = themeBtnRef.current.getBoundingClientRect()
      setThemePos({ top: r.top, left: r.right + 8 })
    } else {
      setThemePos(null)
    }
  }, [themeOpen])

  useEffect(() => {
    if (!themeOpen) return
    const close = () => { setThemeOpen(false); setThemePos(null) }
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [themeOpen])

  // Close on click outside — also close lang sub-menu.
  // 需把 portal 出去的子菜单也算「内部」，否则点子菜单的选项会被先当作「外部」关掉。
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const inMenu = menuRef.current && menuRef.current.contains(e.target as Node)
      const inSubmenu = submenuRef.current && submenuRef.current.contains(e.target as Node)
      const inThemeSubmenu = themeSubmenuRef.current && themeSubmenuRef.current.contains(e.target as Node)
      if (!inMenu && !inSubmenu && !inThemeSubmenu) {
        setOpen(false)
        setLangOpen(false)
        setLangPos(null)
        setThemeOpen(false)
        setThemePos(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const themeOptions: { value: ThemePref; label: string; icon: ReactNode }[] = [
    { value: "light", label: t("themeLight"), icon: <SunIcon /> },
    { value: "dark", label: t("themeDark"), icon: <MoonIcon /> },
    { value: "system", label: t("themeSystem"), icon: <MonitorIcon /> },
  ]
  const themeCurrent = themeOptions.find((o) => o.value === pref) ?? themeOptions[2]

  return (
    <>
      {demoLangToast && typeof document !== "undefined" && createPortal(
        /* Centered toast — floats in middle of screen, auto-dismisses 2.5s */
        <div className="fixed inset-0 flex items-start justify-center pt-[33vh] pointer-events-none z-[99999]">
          <div role="status" className="bg-bg-inverse text-white border border-border shadow-lg px-5 py-3 rounded-xl text-sm max-w-[90vw] text-center">
            {demoLangToast}
          </div>
        </div>,
        document.body
      )}
    <div ref={menuRef} className="relative">
      {/* 头像行：右侧直接放「退出登录」——与移动端头像抽屉保持同一种做法，
          不用展开下拉菜单才找得到。
          ⚠️ 这一行原来是**一个** button，如果直接在里面再放一个退出 button，
             就变成 button 套 button 的非法结构（React 报 hydration error），
             所以这里拆成并列的两个兄弟按钮：左边负责展开菜单，右边负责退出。 */}
      <div className="flex items-center">
        <button
          onClick={() => { if (open) setLangOpen(false); setOpen(!open) }}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-primary hover:bg-surface w-full min-w-0 text-left transition-colors cursor-pointer"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent text-xs font-bold shrink-0">
            {initial}
          </span>
          <span className="truncate flex-1">{isDemoUser && !isChineseLocale(locale) ? "Demo User" : name}</span>
          <svg className={`w-4 h-4 shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          title={t("logout")}
          aria-label={t("logout")}
          className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg text-text-secondary hover:bg-surface hover:text-error transition-colors cursor-pointer"
        >
          <LogoutIcon />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-xl shadow-lg py-1.5 text-sm">
          <Link
            href={NAV_ACCOUNT_LINKS[0].href}
            onClick={() => { setOpen(false); setLangOpen(false) }}
            className="flex items-center gap-2.5 px-4 py-2 text-text-secondary hover:bg-surface hover:text-accent transition-colors"
          >
            <span className="inline-flex shrink-0 text-text-secondary">
              <GearIcon />
            </span>
            <span>{t(NAV_ACCOUNT_LINKS[0].labelKey)}</span>
          </Link>
          <div className="border-t border-border my-1" />
          {/* Theme sub-menu（与语言同样的二级展开方式） */}
          <div className="relative">
            <button
              ref={themeBtnRef}
              onClick={(e) => { e.stopPropagation(); setThemeOpen(!themeOpen) }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-secondary hover:bg-surface hover:text-accent transition-colors"
            >
              <span className="inline-flex shrink-0">{themeCurrent.icon}</span>
              <span className="flex-1 text-left">{t("themeTitle")}</span>
              <span className="shrink-0 text-text-secondary">{themeCurrent.label}</span>
              <svg className={`w-3 h-3 text-text-secondary transition-transform ${themeOpen ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            {themeOpen && themePos && typeof document !== "undefined" && createPortal(
              <div
                ref={themeSubmenuRef}
                style={{ position: "fixed", top: themePos.top, left: themePos.left, zIndex: 50 }}
                className="bg-card border border-border rounded-lg shadow-lg py-1 w-[170px]"
              >
                {themeOptions.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => {
                      applyPref(o.value)
                      // 与手机版一致：选中后收起子菜单并关闭整个用户面板
                      setThemeOpen(false)
                      setThemePos(null)
                      setOpen(false)
                    }}
                    className={"flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors " + (pref === o.value ? "text-accent bg-accent/10 font-medium" : "text-text-secondary hover:bg-accent/10 hover:text-accent")}
                  >
                    <span className="inline-flex shrink-0">{o.icon}</span>
                    <span className="flex-1 text-left">{o.label}</span>
                    {pref === o.value && (
                      <span className="inline-flex shrink-0">
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>
          {/* Language sub-menu */}          <div className="relative">
            <button
              ref={langBtnRef}
              onClick={(e) => { e.stopPropagation(); setLangOpen(!langOpen) }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-secondary hover:bg-surface hover:text-accent transition-colors"
            >
              <span className="inline-flex shrink-0 text-text-secondary">
                <GlobeIcon />
              </span>
              <span className="flex-1 text-left">{t("language")}</span>
              <svg className={`w-3 h-3 text-text-secondary transition-transform ${langOpen ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            {langOpen && langPos && typeof document !== "undefined" && createPortal(
              <div
                ref={submenuRef}
                style={{ position: "fixed", top: langPos.top, left: langPos.left, zIndex: 50 }}
                className="bg-card border border-border rounded-lg shadow-lg py-1 w-[110px]"
              >
                {locales
                  .filter((l) => !isDemoUser || l === "zh-CN" || l === "en")
                  .map((l) => {
                  const active = l === locale
                  return (
                    <button
                      key={l}
                      onClick={() => {
                                              setLangOpen(false)
                                              setOpen(false)
                                              if (isDemoUser && l !== "zh-CN" && l !== "en") return
                                              if (isDemoUser) {
                                                const msg = t("demoLangToast")
                                                setDemoLangToast(msg)
                                                sessionStorage.setItem("demoLangToast", msg)
                                                setTimeout(() => { setDemoLangToast(""); sessionStorage.removeItem("demoLangToast") }, 2500)
                                              }
                                              // replace 而非 push：切换语言不往历史栈加记录，返回按钮回到上一个界面
                                              router.replace(window.location.pathname.replace(new RegExp("^/(?:" + locales.join("|") + ")(/|$)"), "/") || "/", { locale: l })
                                            }}
                      className={"w-full text-left px-4 py-2 text-sm transition-colors " + (active ? "text-accent bg-accent/10 font-medium" : "text-text-secondary hover:bg-accent/10 hover:text-accent")}
                    >
                      {localeNames[l] || l}
                    </button>
                  )
                })}
              </div>,
              document.body
            )}
          </div>
          {/* 这里原先还有一条「退出登录」，已移除：头像行右侧已经有专门的退出按钮，
              同一个面板里放两个做同一件事的入口纯属冗余（移动端本来就只保留一个），
              而且两处入口以后改退出逻辑要改两遍、容易漏掉一处。 */}
        </div>
      )}
    </div>
    </>
  )
}