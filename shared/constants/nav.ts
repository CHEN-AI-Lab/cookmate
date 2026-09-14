// ─── 导航信息架构（单一事实来源）───
//
// 为什么放在 shared：桌面端侧边栏、移动端底部标签栏与头像菜单、以及将来的小程序 / APP
// 都用同一份导航结构 —— 与 shared/constants/locales.ts「All platforms (Web, MiniProgram,
// App, Desktop) read from here」同一个口径。
//
// 历史坑（2026-09-14）：Sidebar.tsx 与 MobileNav.tsx 各自手写了一份 navItems，结果把
// 「我的菜谱 / AI菜谱」调换顺序时只改了桌面端那份、手机端没跟上 —— 用户看到的是
// 「电脑上调了、手机还是老顺序」。新增 / 调整导航项只改本文件，禁止再在组件里手写列表。
//
// 文案统一走 shared/messages 的 nav 命名空间（labelKey），组件用 useTranslations("nav") 取值。

export interface NavLink {
  /** 应用内路径，不含 locale 前缀（如 /app/dashboard） */
  href: string
  /** i18n 键，取自 shared/messages/*.json 的 nav 命名空间 */
  labelKey: string
}

export interface NavItem extends NavLink {
  /** 内容页图标（emoji，沿用现有视觉）；账户类条目在组件内用 SVG，不走这里 */
  icon: string
  /**
   * 是否占用移动端底部标签栏的一个格子。
   * 展示顺序即本数组顺序；未标 true 的内容页在移动端改从头像菜单进入（如 食材库 / 账单）。
   */
  inMobileTab?: boolean
}

/**
 * 内容页导航 —— 顺序即展示顺序，桌面端侧边栏全量展示。
 *
 * 移动端底部标签栏只取 inMobileTab 的项，最多 MOBILE_TAB_MAX 格：6 格时每格仅约 62px，
 * 而日文「ダッシュボード」需要约 70px，会被截断（英文 Grocery List 也处于临界）。
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/app/dashboard", icon: "📊", labelKey: "dashboard", inMobileTab: true },
  { href: "/app/my-recipes", icon: "📚", labelKey: "myRecipes", inMobileTab: true },
  { href: "/app/recipes", icon: "🍳", labelKey: "aiRecipes", inMobileTab: true },
  { href: "/app/meal-plan", icon: "📅", labelKey: "mealPlan", inMobileTab: true },
  { href: "/app/grocery-list", icon: "🛒", labelKey: "groceryList", inMobileTab: true },
  { href: "/app/pantry", icon: "🥦", labelKey: "pantry" },
  { href: "/app/billing", icon: "💳", labelKey: "billing" },
]

/** 移动端底部标签栏最多几格 —— 超出会在英文 / 日文下截断标签（见 NAV_ITEMS 注释） */
export const MOBILE_TAB_MAX = 5

/** 移动端底部标签栏的导航项（顺序同 NAV_ITEMS） */
export const MOBILE_TAB_ITEMS: readonly NavItem[] = NAV_ITEMS.filter((item) => item.inMobileTab)

/** 内容页里不进底栏的项 —— 移动端收进头像菜单 */
export const MOBILE_MENU_ITEMS: readonly NavItem[] = NAV_ITEMS.filter((item) => !item.inMobileTab)

/** 账户类导航链接 —— 桌面端头像下拉与移动端头像菜单共用 */
export const NAV_ACCOUNT_LINKS: readonly NavLink[] = [
  { href: "/app/settings", labelKey: "settings" },
]

/**
 * 管理员入口 —— 仅管理员可见。
 *
 * ⚠️ label 目前是硬编码中文，尚未进 i18n（messages 里还没有 nav.admin 键，历史上就写在组件里，
 * 两端各写一份）。补 i18n 时：在 shared/messages 四个语言文件加 nav.admin，
 * 把 label 换成 labelKey: "admin" 即可，两端会自动跟着走。
 */
export const NAV_ADMIN_ITEM = { href: "/admin", icon: "🛡️", label: "管理员" } as const

/**
 * 当前路径是否命中某导航项（高亮判定）。
 *
 * 必须用 endsWith 而不是 ===：next/navigation 的 pathname 带 locale 前缀
 * （/zh-CN/app/dashboard），写成 === 会永远不相等 → 高亮整条失效。
 * 移动端导航曾因此一直没有当前页高亮，此处收敛成唯一实现。
 */
export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.endsWith(href)
}
