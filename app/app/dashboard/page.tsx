"use client"

import { useState, useEffect } from "react"
import OnboardingWizard from "@/components/OnboardingWizard"
import { StatsCard } from "@/components/features/StatsCard"
import { HeroCTA } from "@/components/features/HeroCTA"
import { QuickActionCard } from "@/components/features/QuickActionCard"

interface DashboardStats {
  pantryCount: number
  starredCount: number
  mealPlanCount: number
  todayUsage: number
  subscriptionTier: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/user/onboarding").then((r) => r.json()),
    ])
      .then(([statsData, onboardingData]) => {
        setStats(statsData)
        if (!onboardingData.onboardingCompleted) {
          setShowOnboarding(true)
        }
      })
      .catch((err) => console.error("Dashboard fetch error:", err))
      .finally(() => setLoading(false))
  }, [])

  const handleOnboardComplete = () => {
    setShowOnboarding(false)
  }

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>

  return (
    <>
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardComplete} />}
      <div className="space-y-8">
        {/* ===== Welcome header ===== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">👋 欢迎回来</h1>
            <p className="text-gray-500 mt-1 text-sm">一天的好心情，从决定吃什么开始</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[#FF6B35] text-xs font-semibold rounded-full">
            {stats?.subscriptionTier === "PRO" ? "🌟 Pro 用户" : "🍳 免费版"}
          </span>
        </div>

        {/* ===== Hero CTA — 今日推荐 ===== */}
        <HeroCTA />

        {/* ===== Stats section — 3 cards ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* AI生成次数 */}
          <StatsCard label="AI 生成" value={stats?.subscriptionTier === "PRO" ? "∞" : `${stats?.todayUsage ?? 0}/1`} subtext={stats?.subscriptionTier === "PRO" ? "不限次数" : "免费版每日 1 次"} />

          {/* 食材数 */}
          <StatsCard label="食材数" value={stats?.pantryCount ?? 0} subtext="冰箱里的食材" />

          {/* 收藏菜谱 */}
          <StatsCard label="收藏菜谱" value={stats?.starredCount ?? 0} subtext="你的私房菜单" />
        </div>

        {/* ===== Quick access — 3 cards ===== */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="h-px flex-1 bg-gray-100" />
            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase shrink-0">快捷入口</span>
            <span className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickActionCard href="/app/pantry" title="管理食材" desc="看看冰箱里还有什么" emoji="🥦" hoverBorder="hover:border-green-200" hoverShadow="hover:shadow-green-100/40" />
            <QuickActionCard href="/app/meal-plan" title="周计划" desc="规划这一周吃什么" emoji="📅" hoverBorder="hover:border-blue-200" hoverShadow="hover:shadow-blue-100/40" />
            <QuickActionCard href="/app/grocery-list" title="购物清单" desc="出门买菜不遗漏" emoji="🛒" hoverBorder="hover:border-orange-200" hoverShadow="hover:shadow-orange-100/40" />
          </div>
        </div>
      </div>
    </>
  )
}