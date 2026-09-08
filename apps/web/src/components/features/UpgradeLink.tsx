"use client"

import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { Link } from "@/i18n/navigation"

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
 * text 支持富文本（内嵌升级链接），点弹框外遮罩即可关闭。
 */
export function UpgradeDialog({ text, onClose }: { text: ReactNode; onClose: () => void }) {
  // 5 秒自动消失：提示是辅助信息，不该一直挡在屏幕中间；点遮罩也随时可关
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const timer = setTimeout(() => onCloseRef.current(), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-brand border border-accent/60 rounded-2xl px-6 py-5 w-full max-w-xs text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-text-primary leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
