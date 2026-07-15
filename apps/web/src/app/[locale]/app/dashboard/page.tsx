"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import OnboardingWizard from "@/components/OnboardingWizard"
import { StatsCard } from "@/components/features/StatsCard"
import { HeroCTA } from "@/components/features/HeroCTA"
import { QuickActionCard } from "@/components/features/QuickActionCard"
import Link from "next/link"

interface DashboardStats {
  pantryCount: number
  starredCount: number
  mealPlanCount: number
  todayUsage: number
  subscriptionTier: string
}

export default function DashboardPage() {
  const td = useTranslations("dashboard")
  const tc = useTranslations("common")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isDemoUser, setIsDemoUser] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/user/onboarding").then((r) => r.json()),
    ])
      .then(([statsData, onboardingData]) => {
        setStats(statsData)
        if (statsData.isDemoUser) setIsDemoUser(true)
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

  if (loading) return <div className="text-center py-16 text-gray-400">{td("loading")}</div>

  return (
    <>
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardComplete} />}
      <div className="space-y-8">
        {/* ===== Welcome header ===== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{td("welcomeBack")}</h1>
            <p className="text-gray-500 mt-1 text-sm">{td("welcomeDesc")}</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[#FF6B35] text-xs font-semibold rounded-full">
            {stats?.subscriptionTier === "PRO" ? td("proUser") : td("freeUser")}
          </span>
        </div>

        {/* ===== Demo banner ===== */}
        {isDemoUser && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-bold text-amber-800 text-sm">{tc("demoMode")}</p>
                <p className="text-xs text-amber-600 mt-1">{tc("demoDesc")}</p>
              </div>
              <Link
                href="/register"
                className="bg-[#FF6B35] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-all shrink-0"
              >
                {tc("freeRegister")}
              </Link>
            </div>
          </div>
        )}

        {/* ===== Hero CTA — 今日推荐 ===== */}
        <HeroCTA />

        {/* ===== Stats section — 3 cards ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* AI生成次数 */}
          <StatsCard
            label={td("aiGenerate")}
            value={isDemoUser ? "3" : stats?.subscriptionTier === "PRO" ? "∞" : `${stats?.todayUsage ?? 0}/1`}
            subtext={isDemoUser ? td("subtextAiGenerateDemo") : stats?.subscriptionTier === "PRO" ? td("subtextAiGeneratePro") : td("subtextAiGenerateFree")}
          />

          {/* 食材数 */}
          <StatsCard label={td("pantryCount")} value={isDemoUser ? 22 : stats?.pantryCount ?? 0} subtext={isDemoUser ? td("subtextPantryDemo") : td("subtextPantry")} />

          {/* 收藏菜谱 */}
          <StatsCard label={td("starredCount")} value={isDemoUser ? 3 : stats?.starredCount ?? 0} subtext={isDemoUser ? td("subtextStarredDemo") : td("subtextStarred")} />
        </div>

        {/* ===== Quick access — 3 cards ===== */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="h-px flex-1 bg-gray-100" />
            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase shrink-0">{td("quickAccess")}</span>
            <span className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickActionCard href="/app/pantry" title={td("managePantry")} desc={td("pantryDesc")} emoji="🥦" hoverBorder="hover:border-green-200" hoverShadow="hover:shadow-green-100/40" />
            <QuickActionCard href="/app/meal-plan" title={td("mealPlanTitle")} desc={td("mealPlanDesc")} emoji="📅" hoverBorder="hover:border-blue-200" hoverShadow="hover:shadow-blue-100/40" />
            <QuickActionCard href="/app/grocery-list" title={td("groceryTitle")} desc={td("groceryDesc")} emoji="🛒" hoverBorder="hover:border-orange-200" hoverShadow="hover:shadow-orange-100/40" />
          </div>
        </div>
      </div>
    </>
  )
}