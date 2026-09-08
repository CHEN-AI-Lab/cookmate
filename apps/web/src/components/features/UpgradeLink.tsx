"use client"

import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

/**
 * 「升级到 Pro」链接 — 统一跳转账单页（登录用户可直接购买套餐）。
 * 用于免费版限制提示：光告诉用户"已达上限"不够，必须给他一条升级入口。
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
