"use client"

import { useState, useEffect } from "react"
import OnboardingWizard from "@/components/OnboardingWizard"

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
      .catch(() => {})
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
        {/* Welcome header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👋 欢迎回来</h1>
          <p className="text-gray-500 mt-1">今天想吃点什么？</p>
        </div>

        {/* Hero CTA — 今日推荐 */}
        <div className="bg-white rounded-2xl border-l-4 border-[#FF6B35] shadow-sm p-6 sm:p-8">
          <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">🔥 今日推荐</h2>
              <p className="text-gray-500 mt-1 text-sm">查看你的食材，让 AI 推荐今晚吃什么</p>
            </div>
            <a
              href="/app/recipes"
              className="inline-flex items-center gap-2 bg-[#FF6B35] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors shrink-0 shadow-sm"
            >
              🍳 开始生成菜谱
            </a>
          </div>
        </div>

        {/* Stats section */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-lg">🤖</div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.subscriptionTier === "PRO" ? "∞" : `${stats?.todayUsage ?? 0}/1`}
              </p>
              <p className="text-sm font-medium text-gray-500 mt-1">AI生成</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats?.subscriptionTier === "PRO" ? "不限次数" : "免费版每日1次"}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-lg">🥦</div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats?.pantryCount ?? 0}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">食材数</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-lg">⭐</div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats?.starredCount ?? 0}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">收藏菜谱</p>
            </div>
          </div>
        </div>

        {/* Quick access */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">快捷入口</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: "/app/pantry", title: "管理食材", desc: "添加冰箱里的食材", emoji: "🥦", color: "hover:border-green-200" },
              { href: "/app/meal-plan", title: "周计划", desc: "规划本周吃什么", emoji: "📅", color: "hover:border-blue-200" },
              { href: "/app/grocery-list", title: "购物清单", desc: "看看要买什么", emoji: "🛒", color: "hover:border-orange-200" },
            ].map((action) => (
              <a
                key={action.title}
                href={action.href}
                className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md ${action.color} transition-all text-center`}
              >
                <span className="text-2xl">{action.emoji}</span>
                <h4 className="mt-3 font-semibold text-gray-900">{action.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}