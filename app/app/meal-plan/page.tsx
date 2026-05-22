"use client"

import { useState, useEffect, useCallback } from "react"

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
        <div className="space-y-3">
          {DAY_LABELS.map((day, dayIdx) => (
            <div key={day} className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden">
              <div className="bg-orange-50 px-4 py-2 font-bold text-[#2D3436] text-sm">{day}</div>
              <div className="grid grid-cols-3 divide-x divide-gray-100">
                {MEAL_TYPES.map((meal) => {
                  const slot = getSlot(dayIdx, meal)
                  return (
                    <button
                      key={meal}
                      onClick={() => setDetail({ day: dayIdx, meal })}
                      className="p-3 text-left hover:bg-orange-50/50 transition-colors min-h-[70px]"
                    >
                      <p className="text-xs text-gray-400 mb-1">{MEAL_EMOJIS[meal]} {MEAL_LABELS[meal]}</p>
                      {slot?.recipe ? (
                        <div>
                          <div className="flex items-center gap-1">
                          <p className="text-sm font-medium text-[#2D3436] truncate">{slot.recipe.title}</p>
                          {slot.recipe.starred && <span className="text-amber-400 text-xs shrink-0">⭐</span>}
                        </div>
                          {slot.recipe.cookingTime && (
                            <p className="text-xs text-gray-400 mt-0.5">⏱ {slot.recipe.cookingTime}分钟</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300">未安排</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal — read‑only, no edit */}
      {detail && (() => {
        const slot = getSlot(detail.day, detail.meal)
        const hasRecipe = slot?.recipe?.title || slot?.recipe?.ingredients || slot?.recipe?.steps || slot?.recipe?.cookingTime || slot?.recipe?.calories
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDetail(null)}>
            <div className="bg-white rounded-2xl p-6 w-96 shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">
                  {DAY_LABELS[detail.day]} · {MEAL_LABELS[detail.meal]}
                </p>
                <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
              </div>

              {hasRecipe ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#2D3436] text-lg">{slot?.recipe?.title}</h3>
                    {slot?.recipe?.id && (
                      <button
                        onClick={() => toggleStar(slot!.recipe!.id!)}
                        className={`transition-colors text-lg ${slot?.recipe?.starred ? "text-amber-400" : "text-gray-300 hover:text-amber-400"}`}
                        title={slot?.recipe?.starred ? "取消收藏" : "收藏菜谱"}
                      >
                        {slot?.recipe?.starred ? "⭐" : "☆"}
                      </button>
                    )}
                  </div>
                  {slot?.recipe?.cookingTime && (
                    <p className="text-sm text-gray-600">⏱ 烹饪时间：{slot.recipe.cookingTime} 分钟</p>
                  )}
                  {slot?.recipe?.calories && (
                    <p className="text-sm text-gray-600">🔥 热量：{slot.recipe.calories} 千卡</p>
                  )}
                  {slot?.recipe?.ingredients && (
                    <div>
                      <p className="text-sm font-semibold text-[#2D3436] mb-1">🥦 食材清单</p>
                      <p className="text-sm text-gray-600">{slot.recipe.ingredients.split(", ").join("、")}</p>
                    </div>
                  )}
                  {slot?.recipe?.steps && (
                    <div>
                      <p className="text-sm font-semibold text-[#2D3436] mb-1">📝 做法步骤</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        {slot.recipe.steps.split("\n").map((step, idx) => (
                          <p key={idx}>{idx + 1}. {step}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <hr className="border-gray-100" />
                  <button
                    onClick={deleteSlot}
                    className="w-full py-2 rounded-xl text-sm border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    ✕ 删掉这个菜
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center space-y-4">
                  <p className="text-gray-500 text-sm">未安排菜品</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    💡 去 🤖 AI 菜谱 或 📚 我的菜谱 生成菜谱后，再添加到周计划
                  </p>
                  <div className="flex gap-3 justify-center pt-2">
                    <button
                      onClick={() => { window.location.href = "/app/recipes" }}
                      className="flex-1 py-2.5 rounded-xl text-sm bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:opacity-90 transition-opacity"
                    >
                      🤖 去 AI 菜谱
                    </button>
                    <button
                      onClick={() => { window.location.href = "/app/my-recipes" }}
                      className="flex-1 py-2.5 rounded-xl text-sm bg-gradient-to-r from-orange-400 to-amber-400 text-white hover:opacity-90 transition-opacity"
                    >
                      📚 去我的菜谱
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {starToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D3436] text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          {starToast}
        </div>
      )}
    </div>
  )
}