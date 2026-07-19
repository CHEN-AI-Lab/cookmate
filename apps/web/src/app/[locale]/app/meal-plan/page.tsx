"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import { MealPlanGrid } from "@/components/features/MealPlanGrid"
import { MealPlanDetailModal } from "@/components/features/MealPlanDetailModal"
import { getDemoMealPlan } from "@cookmate/shared/demo-data"
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

const MEAL_TYPES = ["breakfast", "lunch", "dinner"]

export default function MealPlanPage() {
  const t = useTranslations("mealPlan")
  const locale = useLocale()
  const tc = useTranslations("common")
  const tr = useTranslations("recipes")
  const DAY_LABELS = [t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday"), t("sunday")]
  const MEAL_LABELS: Record<string, string> = {
    breakfast: t("breakfast"), lunch: t("lunch"), dinner: t("dinner"),
  }
  const MEAL_EMOJIS: Record<string, string> = {
    breakfast: "🌅", lunch: "☀️", dinner: "🌙",
  }
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [detail, setDetail] = useState<{ day: number; meal: string } | null>(null)
  const [starToast, setStarToast] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDemoUser, setIsDemoUser] = useState(false)

  useEffect(() => {
    fetch("/api/meal-plan")
      .then((r) => r.json())
      .then((data) => {
        if (data.plans?.length > 0) setPlan(data.plans[0])
      })
      .catch((err) => console.error("load meal plan error:", err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.isDemoUser) {
          setIsDemoUser(true)
          setPlan((prev) => prev || getDemoMealPlan(locale))
        }
      })
      .catch((err) => console.error("load profile error:", err))
  }, [])

  const generatePlan = async () => {
    setGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/meal-plan", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.plan) {
        setPlan(data.plan)
      } else {
        setError(data.detail ? `${data.error} (${data.detail})` : (data.error || t("generateFailed")))
      }
    } catch (err) {
      console.error("generate plan error:", err)
      setError(t("networkError"))
    } finally {
      setGenerating(false)
    }
  }

  const getSlot = (day: number, meal: string): MealSlot | undefined =>
    plan?.slots.find((s) => s.dayOfWeek === day && s.mealType === meal)

  const deleteSlot = async () => {
    if (!detail || !plan) return
    if (isDemoUser) {
      setStarToast(t("demoLocked"))
      setTimeout(() => setStarToast(""), 2500)
      return
    }
    setDeleteConfirm(true)
  }

  const confirmDelete = async () => {
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
      if (!res.ok) throw new Error(t("deleteSlotFailed"))
    } catch (err) {
      console.error("delete slot error:", err)
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
    setStarToast(t("deleteSlotSuccess"))
    setTimeout(() => setStarToast(""), 2500)
  }

  const toggleStar = async (recipeId: string) => {
    const r = await fetch("/api/recipes/star", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId }),
    })
    const data = await r.json()
    if (data.success) {
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
      setStarToast(data.starred ? t("starToast") : t("unstarToast"))
      setTimeout(() => setStarToast(""), 2500)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">{t("loading")}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2D3436]">{t("title")}</h1>
        <button
          onClick={generatePlan}
          disabled={generating || isDemoUser}
          className="bg-[#FF6B35] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {generating ? t("generating") : isDemoUser ? t("demoLocked") : t("generate")}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {!plan && !generating && (
        <div className="text-center py-16">
          <span className="text-5xl">📋</span>
          <p className="mt-4 text-gray-500">{t("noPlan")}</p>
          <p className="text-sm text-gray-400 mt-1">{t("noPlanHint")}</p>
        </div>
      )}

      {generating && (
        <div className="text-center py-16">
          <span className="text-5xl animate-bounce">🤔</span>
          <p className="mt-4 text-gray-500">{t("generatingDesc")}</p>
        </div>
      )}

      {plan && !generating && (
        <MealPlanGrid
          plan={plan}
          onSlotClick={(day, meal) => setDetail({ day, meal })}
        />
      )}

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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <p className="text-sm text-[#2D3436] font-medium mb-1">{t("confirmDeleteTitle")}</p>
            <p className="text-sm text-gray-500">{t("confirmDeleteDesc", { title: detail && plan ? getSlot(detail.day, detail.meal)?.recipe?.title || "" : "" })}</p>
            <p className="text-xs text-gray-400 mt-2">{t("irreversible")}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">{tc("cancel")}</button>
              <button onClick={() => { setDeleteConfirm(false); confirmDelete() }} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm">{t("confirmDelete")}</button>
            </div>
          </div>
        </div>
      )}

      {starToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D3436] text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          {starToast}
        </div>
      )}
    </div>
  )
}