"use client"

import { useState, useEffect, useCallback } from "react"
import { MealPlanGrid } from "@/components/features/MealPlanGrid"
import { MealPlanDetailModal } from "@/components/features/MealPlanDetailModal"

interface Recipe {
  id?: string
  title: string
  description: string
  ingredients?: string
  steps?: string
  cookingTime?: number
  calories?: number
  cuisineType?: string
  starred?: boolean
}

interface MealSlot {
  id: string
  dayOfWeek: number
  mealType: string
  recipe: Recipe | null
  note: string | null
}

interface MealPlan {
  id: string
  weekStart: string
  slots: MealSlot[]
}

const DAY_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
const MEAL_TYPES = ["breakfast", "lunch", "dinner"]
const MEAL_LABELS: Record<string, string> = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" }
const MEAL_EMOJIS: Record<string, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" }

export default function MealPlanPage() {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [detail, setDetail] = useState<{ day: number; meal: string } | null>(null)
  const [starToast, setStarToast] = useState("")

  const loadPlan = useCallback(async () => {
    try {
      const res = await fetch("/api/meal-plan")
      const data = await res.json()
      if (data.plans?.length > 0) setPlan(data.plans[0])
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPlan() }, [loadPlan])

  const generatePlan = async () => {
    setGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/meal-plan", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.plan) {
        setPlan(data.plan)
      } else {
        setError(data.error || "生成失败")
      }
    } catch {
      setError("网络错误")
    } finally {
      setGenerating(false)
    }
  }

  const getSlot = (day: number, meal: string): MealSlot | undefined =>
    plan?.slots.find((s) => s.dayOfWeek === day && s.mealType === meal)

  const deleteSlot = async () => {
    if (!detail || !plan) return
    const slot = getSlot(detail.day, detail.meal)
    if (!slot) return

    try {
      const res = await fetch("/api/meal-plan/slot", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          title: "",
          description: "",
        }),
      })
      if (!res.ok) throw new Error("删除失败")
    } catch {
      return
    }

    const updatedSlots = plan.slots.map((s) => {
      if (s.dayOfWeek === detail.day && s.mealType === detail.meal) {
        return { ...s, recipe: null }
      }
      return s
    })
    setPlan({ ...plan, slots: updatedSlots })
    setDetail(null)
  }

  const toggleStar = async (recipeId: string) => {
    const r = await fetch("/api/recipes/star", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId }),
    })
    const data = await r.json()
    if (data.success) {
      // 更新本地 state，图标立即反映状态
      setPlan((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          slots: prev.slots.map((s) =>
            s.recipe?.id === recipeId
              ? { ...s, recipe: { ...s.recipe, starred: data.starred } as Recipe }
              : s
          ),
        }
      })
      setStarToast(data.starred ? "⭐ 已收藏" : "已取消收藏")
      setTimeout(() => setStarToast(""), 2500)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2D3436]">📅 本周计划</h1>
        <button
          onClick={generatePlan}
          disabled={generating}
          className="bg-[#FF6B35] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {generating ? "🤖 生成中..." : "🤖 AI 生成整周计划"}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {!plan && !generating && (
        <div className="text-center py-16">
          <span className="text-5xl">📋</span>
          <p className="mt-4 text-gray-500">还没有周计划</p>
          <p className="text-sm text-gray-400 mt-1">点击按钮让 AI 为你规划一周菜单，生成后点击格子可以查看详情</p>
        </div>
      )}

      {generating && (
        <div className="text-center py-16">
          <span className="text-5xl animate-bounce">🤔</span>
          <p className="mt-4 text-gray-500">AI 正在为你规划一周菜单...</p>
        </div>
      )}

      {plan && !generating && (
        <MealPlanGrid
          plan={plan}
          onSlotClick={(day, meal) => setDetail({ day, meal })}
        />
      )}

{/* Detail modal — read‑only, no edit */}
      <MealPlanDetailModal
        open={detail !== null}
        onClose={() => setDetail(null)}
        day={detail?.day ?? 0}
        meal={detail?.meal ?? ""}
        slot={detail ? getSlot(detail.day, detail.meal) : undefined}
        dayLabels={DAY_LABELS}
        mealLabels={MEAL_LABELS}
        onToggleStar={toggleStar}
        onDeleteSlot={deleteSlot}
        onNavigateTo={(path) => { window.location.href = path }}
      />

      {starToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D3436] text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          {starToast}
        </div>
      )}
    </div>
  )
}