"use client"

import type { ReactNode } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

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
 * 免费版限制提示弹框 — 居中显示、宽度紧凑、带遮罩。
 * 为什么用弹框不用页面横幅：横幅固定在页面顶部，用户滚到页面中下部触发限制时根本看不到；
 * 弹框永远在视口正中，触发即见。米色底 + 橙描边走 CSS 变量，深色模式正常。
 * text 支持富文本（内嵌升级链接），点遮罩/按钮均可关闭。
 */
export function UpgradeDialog({ text, onClose }: { text: ReactNode; onClose: () => void }) {
  const t = useTranslations("common")
  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-brand border border-accent/60 rounded-2xl px-6 py-5 w-full max-w-xs text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-text-primary leading-relaxed">{text}</p>
        <button
          onClick={onClose}
          className="mt-4 bg-accent text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          {t("confirm")}
        </button>
      </div>
    </div>
  )
}
