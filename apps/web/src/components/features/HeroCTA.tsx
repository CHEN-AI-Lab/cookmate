"use client"

import { useTranslations } from "next-intl"

export function HeroCTA() {
  const td = useTranslations("dashboard")
  const thero = useTranslations("hero")

  return (
    <div className="bg-white rounded-2xl border-l-4 border-[#FF6B35] shadow-sm shadow-orange-100/40 p-6 sm:p-8">
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">🔥 {td("todayRecommend")}</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {td("recommendDesc")}
          </p>
        </div>
        <a
          href="/app/recipes"
          className="inline-flex items-center gap-2 bg-[#FF6B35] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-200/50 transition-all duration-200 shrink-0"
        >
          🍳 {thero("cta")}
        </a>
      </div>
    </div>
  )
}