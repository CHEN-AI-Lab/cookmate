"use client"

import type { ReactNode } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

/**
 * 独立「升级到 Pro」链接 — 用于弹窗/提示条尾部等需要单独放置入口的场景。
 * 统一跳转账单页（登录用户可直接购买套餐）。
 */
export function UpgradeLink({ className = "" }: { className?: string }) {
  const t = useTranslations("billing")
  return (
    <Link
      href="/app/billing"
      className={`underline font-medium hover:opacity-80 transition-opacity ${className}`}
    >
      {t("upgradeAction")}
    </Link>
  )
}

/**
 * 内联升级链接 — 配合 next-intl 的 t.rich 使用，包在文案的 <upgrade> 标签里，
 * 让「升级 Pro」作为句子的一部分可点击，而不是孤零零挂在横幅右侧。
 */
export function UpgradeInline({ children }: { children: ReactNode }) {
  return (
    <Link
      href="/app/billing"
      className="font-semibold text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent transition-all"
    >
      {children}
    </Link>
  )
}

/**
 * 免费版限制持久横幅 — 品牌米色底 + 橙色描边（全部走 CSS 变量，深色模式正常）。
 * 不用红色：限额不是出错，是引导升级，红色错误语义会让用户烦躁（Canva 设计规范同款思路）。
 * text 支持富文本（内嵌升级链接），横幅不自动消失、可手动关闭。
 */
export function UpgradeBanner({ text, onClose }: { text: ReactNode; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 flex-wrap text-[13px] rounded-xl px-4 py-2.5 bg-bg-brand border border-accent/60 text-text-primary">
      <span>{text}</span>
      <button
        onClick={onClose}
        className="text-text-secondary hover:text-text-primary px-1 shrink-0"
        aria-label="close"
      >
        ×
      </button>
    </div>
  )
}
