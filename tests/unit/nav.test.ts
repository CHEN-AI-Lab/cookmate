// 导航定义回归测试
//
// 背景：Sidebar 与 MobileNav 曾各写一份 navItems，结果「我的菜谱 / AI菜谱」调换顺序
// 只改了桌面端、手机端没跟上；移动端高亮还因 pathname === href（漏了 locale 前缀）
// 永久失效。这里把这几类问题固化成断言，防止回退。
import { describe, it, expect } from 'vitest'
import {
  isNavActive,
  MOBILE_MENU_ITEMS,
  MOBILE_TAB_ITEMS,
  MOBILE_TAB_MAX,
  NAV_ACCOUNT_LINKS,
  NAV_ADMIN_ITEM,
  NAV_ITEMS,
} from '@cookmate/shared/constants/nav'
import en from '@cookmate/shared/messages/en.json'
import zhCN from '@cookmate/shared/messages/zh-CN.json'
import zhTW from '@cookmate/shared/messages/zh-TW.json'
import ja from '@cookmate/shared/messages/ja.json'

const MESSAGES: Record<string, Record<string, string>> = {
  en: (en as { nav: Record<string, string> }).nav,
  'zh-CN': (zhCN as { nav: Record<string, string> }).nav,
  'zh-TW': (zhTW as { nav: Record<string, string> }).nav,
  ja: (ja as { nav: Record<string, string> }).nav,
}

describe('导航定义：一份定义供桌面 / 移动 / 将来小程序·APP 共用', () => {
  it('href 不重复', () => {
    const hrefs = NAV_ITEMS.map((i) => i.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it('移动端底栏不超过 MOBILE_TAB_MAX 格', () => {
    expect(MOBILE_TAB_ITEMS.length).toBeLessThanOrEqual(MOBILE_TAB_MAX)
  })

  it('底栏 + 头像菜单正好覆盖全部内容页，不重不漏', () => {
    const combined = [...MOBILE_TAB_ITEMS, ...MOBILE_MENU_ITEMS].map((i) => i.href).sort()
    expect(combined).toEqual(NAV_ITEMS.map((i) => i.href).sort())
  })

  it('底栏顺序与 NAV_ITEMS 顺序一致（两端不许各排一套）', () => {
    const expected = NAV_ITEMS.filter((i) => i.inMobileTab).map((i) => i.href)
    expect(MOBILE_TAB_ITEMS.map((i) => i.href)).toEqual(expected)
  })

  it('每个导航项的 labelKey 在 4 个语言文件的 nav 里都存在', () => {
    const labelKeys = [
      ...NAV_ITEMS.map((i) => i.labelKey),
      ...NAV_ACCOUNT_LINKS.map((l) => l.labelKey),
    ]
    for (const [locale, nav] of Object.entries(MESSAGES)) {
      const missing = labelKeys.filter((k) => !nav[k])
      expect({ locale, missing }).toEqual({ locale, missing: [] })
    }
  })

  it('账户项与管理员项都有可用入口', () => {
    expect(NAV_ACCOUNT_LINKS.length).toBeGreaterThan(0)
    for (const l of NAV_ACCOUNT_LINKS) expect(l.href).toMatch(/^\/app\//)
    expect(NAV_ADMIN_ITEM.href).toBe('/admin')
    expect(NAV_ADMIN_ITEM.label.trim().length).toBeGreaterThan(0)
  })
})

describe('isNavActive：当前页高亮判定', () => {
  it('带 locale 前缀的路径必须命中（移动端曾因此整条高亮失效）', () => {
    expect(isNavActive('/zh-CN/app/dashboard', '/app/dashboard')).toBe(true)
    expect(isNavActive('/en/app/my-recipes', '/app/my-recipes')).toBe(true)
    expect(isNavActive('/ja/app/meal-plan', '/app/meal-plan')).toBe(true)
  })

  it('不带前缀的路径也命中', () => {
    expect(isNavActive('/app/dashboard', '/app/dashboard')).toBe(true)
  })

  it('不误命中其他页面', () => {
    expect(isNavActive('/en/app/dashboard', '/app/meal-plan')).toBe(false)
    expect(isNavActive('/en/app/settings', '/app/settings-billing')).toBe(false)
  })

  it('每个导航项在自己的路径下都亮，在首个路径下只有它亮', () => {
    for (const item of NAV_ITEMS) {
      const active = NAV_ITEMS.filter((i) => isNavActive(`/zh-CN${item.href}`, i.href))
      expect(active.map((i) => i.href)).toEqual([item.href])
    }
  })
})
