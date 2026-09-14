"use client"

// 移动端导航（< md 显示）：
//   ① 顶栏：Logo + 头像（账户入口）
//   ② 底栏：共享定义里标记 inMobileTab 的高频内容页（最多 5 格）
//   ③ 头像菜单：其余内容页 + 账户项 + 偏好（主题 / 语言走二级子菜单）+ 联系支持 + 退出登录
//
// 导航项一律从 shared/constants/nav.ts 取，禁止在本文件手写列表 ——
// 历史上 Sidebar 与 MobileNav 各写一份，导致顺序调换只改了桌面端。

import { Link, useRouter } from "@/i18n/navigation"
import { usePathname } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { signOut } from "next-auth/react"
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"
import {
  isNavActive,
  locales,
  localeNames,
  MOBILE_MENU_ITEMS,
  MOBILE_TAB_ITEMS,
  NAV_ACCOUNT_LINKS,
  NAV_ADMIN_ITEM,
} from "@cookmate/shared/constants"
import { isChineseLocale } from "@cookmate/shared/constants/locales"
import { SUPPORT_EMAIL } from "@cookmate/shared/constants/support-email"
import { useToast } from "@/components/ui/Toast"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GearIcon,
  GlobeIcon,
  LogoutIcon,
  MailIcon,
} from "@/components/ui/nav-icons"
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

/** 头像菜单里的二级子菜单 —— 同时只开一个 */
type Submenu = "theme" | "language" | null

export function MobileNav({
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
  const locale = useLocale()
  const router = useRouter()
  const { showToast } = useToast()
  const [openPath, setOpenPath] = useState<string | null>(null)
  const [submenu, setSubmenu] = useState<Submenu>(null)
  const initial = name?.charAt(0)?.toUpperCase() || "?"
  const pref = useSyncExternalStore(subscribeTheme, currentPref, (): ThemePref => "system")

  // 菜单是否展开：绑定「打开时所在的路由」，路由一变即自动收起。
  // 用派生值而不是在 effect 里 setState —— 后者会触发级联渲染
  // （eslint react-hooks/set-state-in-effect 明确禁止）。
  const open = openPath === pathname

  const close = useCallback(() => {
    setOpenPath(null)
    setSubmenu(null)
  }, [])

  const openMenu = () => {
    setSubmenu(null)
    setOpenPath(pathname)
  }

  // 菜单打开时锁背景滚动 + 支持 Esc 关闭（只操作 DOM / 订阅事件，不在此 setState）
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
    }
  }, [open, close])

  // 联系支持：优先复制邮箱，剪贴板不可用也不报错，照常给提示（与桌面端一致）
  const copySupportEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
    } catch {
      /* 忽略：http 或未授权时剪贴板不可用 */
    }
    showToast(t("supportCopied", { email: SUPPORT_EMAIL }))
    close()
  }

  // 体验用户只能在中文 / 英文之间切换（与桌面端头像菜单同一口径）
  const visibleLocales = isDemoUser
    ? (locales as readonly string[]).filter((l) => l === "zh-CN" || l === "en")
    : locales

  const switchLocale = (next: string) => {
    close()
    if (isDemoUser && next !== "zh-CN" && next !== "en") return
    // replace 而非 push：切换语言不往历史栈加记录，返回按钮回到上一个界面
    router.replace(
      pathname.replace(new RegExp("^/(?:" + locales.join("|") + ")(/|$)"), "/") || "/",
      { locale: next },
    )
  }

  const themeOptions: { value: ThemePref; label: string; icon: ReactNode }[] = [
    { value: "light", label: t("themeLight"), icon: <SunIcon /> },
    { value: "dark", label: t("themeDark"), icon: <MoonIcon /> },
    { value: "system", label: t("themeSystem"), icon: <MonitorIcon /> },
  ]
  const themeCurrent = themeOptions.find((o) => o.value === pref) ?? themeOptions[2]

  return (
    <>
      {/* 顶栏：只留 Logo 与头像。导航项全部下移 —— 原先 8 项 + 管理员 + 支持 + 主题 + 语言
          全塞在 64px 顶栏里且没有 overflow-x，溢出部分被直接裁掉（只露 6 个、还滑不动）。 */}
      <header className="fixed top-0 left-0 right-0 md:hidden bg-card border-b border-border h-16 z-40 flex items-center justify-between px-4">
        <Link href="/app/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🍳</span>
          <span className="text-base font-bold text-text-primary">CookMate</span>
        </Link>
        <button
          type="button"
          onClick={openMenu}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/10 text-accent text-sm font-bold shrink-0 cursor-pointer"
        >
          {initial}
        </button>
      </header>

      {/* 底栏：高频内容页，最多 5 格（6 格时每格约 62px，日文标签会截断） */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border z-40 flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {MOBILE_TAB_ITEMS.map((item) => {
          const isActive = isNavActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 min-w-0 h-[62px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-accent" : "text-text-secondary"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* 头像菜单（底部抽屉）—— portal 到 body，避免被主内容容器裁切 */}
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 bg-overlay cursor-default"
          />
          <div
            className="absolute left-0 right-0 bottom-0 bg-card border-t border-border rounded-t-2xl max-h-[80%] overflow-y-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="relative overflow-hidden">
              {/* 第一层：主菜单 */}
              <div
                className={`px-2 pt-3 pb-2 transition-transform duration-200 ${
                  submenu ? "-translate-x-full" : "translate-x-0"
                }`}
              >
                {/* 用户信息行右侧原本是空白 —— 「退出登录」直接放这里：
                    原先挂在抽屉最底部，小屏一屏放不下，还得多滚一段才能点到。
                    行内不判空 name：name 缺失时头像回退成「?」，但退出入口必须始终可达。 */}
                <div className="flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-xl bg-surface">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-accent/10 text-accent text-sm font-bold shrink-0">
                    {initial}
                  </span>
                  <span className="flex-1 min-w-0 text-sm font-medium text-text-primary truncate">
                    {isDemoUser && !isChineseLocale(locale) ? "Demo User" : name}
                  </span>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    title={t("logout")}
                    className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-card text-text-secondary hover:text-error hover:bg-border transition-colors cursor-pointer"
                  >
                    <LogoutIcon />
                    <span>{t("logout")}</span>
                  </button>
                </div>

                {/* 未进底栏的内容页（食材库 / 账单） */}
                {MOBILE_MENU_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isNavActive(pathname, item.href)
                        ? "bg-accent/10 text-accent"
                        : "text-text-secondary hover:bg-surface hover:text-accent"
                    }`}
                  >
                    <span className="w-5 text-center text-base">{item.icon}</span>
                    <span className="truncate">{t(item.labelKey)}</span>
                  </Link>
                ))}

                {/* 账户 */}
                <Link
                  href={NAV_ACCOUNT_LINKS[0].href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isNavActive(pathname, NAV_ACCOUNT_LINKS[0].href)
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:bg-surface hover:text-accent"
                  }`}
                >
                  <span className="w-5 flex justify-center shrink-0">
                    <GearIcon />
                  </span>
                  <span className="truncate">{t(NAV_ACCOUNT_LINKS[0].labelKey)}</span>
                </Link>
                {isAdmin && (
                  <Link
                    href={NAV_ADMIN_ITEM.href}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isNavActive(pathname, NAV_ADMIN_ITEM.href)
                        ? "bg-accent/10 text-accent"
                        : "text-text-secondary hover:bg-surface hover:text-accent"
                    }`}
                  >
                    <span className="w-5 text-center text-base">{NAV_ADMIN_ITEM.icon}</span>
                    <span className="truncate">{NAV_ADMIN_ITEM.label}</span>
                  </Link>
                )}

                <div className="border-t border-border my-1.5" />

                {/* 联系支持（Creem 要求应用内可见） */}
                <button
                  type="button"
                  onClick={copySupportEmail}
                  title={SUPPORT_EMAIL}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface hover:text-accent transition-colors cursor-pointer text-left"
                >
                  <span className="w-5 flex justify-center shrink-0">
                    <MailIcon />
                  </span>
                  <span className="truncate">{t("support")}</span>
                </button>

                {/* 主题 → 二级子菜单 */}
                <button
                  type="button"
                  onClick={() => setSubmenu("theme")}
                  aria-haspopup="menu"
                  aria-expanded={submenu === "theme"}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface hover:text-accent transition-colors cursor-pointer text-left"
                >
                  <span className="w-5 flex justify-center shrink-0">{themeCurrent.icon}</span>
                  <span className="flex-1 truncate">{t("themeTitle")}</span>
                  <span className="shrink-0 text-text-secondary">{themeCurrent.label}</span>
                  <span className="shrink-0 text-text-secondary">
                    <ChevronRightIcon />
                  </span>
                </button>

                {/* 语言 → 二级子菜单 */}
                <button
                  type="button"
                  onClick={() => setSubmenu("language")}
                  aria-haspopup="menu"
                  aria-expanded={submenu === "language"}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface hover:text-accent transition-colors cursor-pointer text-left"
                >
                  <span className="w-5 flex justify-center shrink-0">
                    <GlobeIcon />
                  </span>
                  <span className="flex-1 truncate">{t("language")}</span>
                  <span className="shrink-0 text-text-secondary">{localeNames[locale] || locale}</span>
                  <span className="shrink-0 text-text-secondary">
                    <ChevronRightIcon />
                  </span>
                </button>

              </div>

              {/* 第二层：二级子菜单（从右侧滑入 —— 与桌面端行为一致，只是不越出屏幕） */}
              <div
                className={`absolute inset-0 bg-card transition-transform duration-200 ${
                  submenu ? "translate-x-0" : "translate-x-full"
                }`}
                aria-hidden={submenu === null}
              >
                <button
                  type="button"
                  onClick={() => setSubmenu(null)}
                  className="flex items-center gap-2 w-full px-3 py-3 border-b border-border text-sm font-medium text-text-primary cursor-pointer"
                >
                  <ChevronLeftIcon />
                  <span>{submenu === "theme" ? t("themeTitle") : t("language")}</span>
                </button>
                <div className="px-2 py-2">
                  {submenu === "theme"
                    ? themeOptions.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => {
                            // 选完立即收起整个抽屉 —— 与语言一致（switchLocale 里也调了 close()），
                            // 否则用户选完主题仍停在主题列表上，还要自己点返回/遮罩退出
                            applyPref(o.value)
                            close()
                          }}
                          className={
                            "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-colors cursor-pointer text-left " +
                            (pref === o.value
                              ? "text-accent bg-accent/10 font-medium"
                              : "text-text-secondary hover:bg-surface hover:text-accent")
                          }
                        >
                          <span className="w-5 flex justify-center shrink-0">{o.icon}</span>
                          <span className="flex-1">{o.label}</span>
                          {pref === o.value && (
                            <span className="shrink-0">
                              <CheckIcon />
                            </span>
                          )}
                        </button>
                      ))
                    : visibleLocales.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => switchLocale(l)}
                          className={
                            "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-colors cursor-pointer text-left " +
                            (l === locale
                              ? "text-accent bg-accent/10 font-medium"
                              : "text-text-secondary hover:bg-surface hover:text-accent")
                          }
                        >
                          <span className="flex-1">{localeNames[l] || l}</span>
                          {l === locale && (
                            <span className="shrink-0">
                              <CheckIcon />
                            </span>
                          )}
                        </button>
                      ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
