"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { MealPlanGrid } from "@/components/features/MealPlanGrid"
import { MealPlanDetailModal } from "@/components/features/MealPlanDetailModal"
import { getDemoMealPlan } from "@cookmate/shared/demo-data"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

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

export default function MealPlanPage() {
  const t = useTranslations("mealPlan")
  const locale = useLocale()
  const tc = useTranslations("common")
  const DAY_LABELS = [t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday"), t("sunday")]
  const router = useRouter()
  const MEAL_LABELS: Record<string, string> = {
    breakfast: t("breakfast"), lunch: t("lunch"), dinner: t("dinner"),
  }

  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [detail, setDetail] = useState<{ day: number; meal: string } | null>(null)
  const [starToast, setStarToast] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDemoUser, setIsDemoUser] = useState(false)

  // 弹窗状态
  const [showPicker, setShowPicker] = useState(false)
  const [pickStart, setPickStart] = useState<number | null>(null)
  const [pickEnd, setPickEnd] = useState<number | null>(null)

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
  }, [locale])

  const openPicker = () => {
    setPickStart(null)
    setPickEnd(null)
    setShowPicker(true)
  }

  const handleDayClick = (i: number) => {
    if (pickStart === null) {
      setPickStart(i)
    } else if (pickEnd === null) {
      setPickEnd(i)
    } else {
      setPickStart(i)
      setPickEnd(null)
    }
  }

  const confirmGenerate = async () => {
    if (pickStart === null || pickEnd === null) return
    const lo = Math.min(pickStart, pickEnd)
    const hi = Math.max(pickStart, pickEnd)
    const days: number[] = []
    for (let i = lo; i <= hi; i++) days.push(i)

    setShowPicker(false)
    setGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      })
      const data = await res.json()
      if (res.ok && data.plan) {
        setPlan(data.plan)
        if (data.fallback) {
          setError(t("aiFallback"))
        }
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
        body: JSON.stringify({ slotId: slot.id, title: "", description: "" }),
      })
      if (!res.ok) throw new Error(t("deleteSlotFailed"))
    } catch (err) {
      console.error("delete slot error:", err)
      return
    }
    const updatedSlots = plan.slots.map((s) =>
      s.dayOfWeek === detail.day && s.mealType === detail.meal ? { ...s, recipe: null } : s
    )
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
            s.recipe?.id === recipeId ? { ...s, recipe: { ...s.recipe, starred: data.starred } as Recipe } : s
          ),
        }
      })
      setStarToast(data.starred ? t("starToast") : t("unstarToast"))
      setTimeout(() => setStarToast(""), 2500)
    }
  }

  if (loading) return <div className="text-center py-16 text-text-secondary">{t("loading")}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
        <button
          onClick={isDemoUser ? undefined : openPicker}
          disabled={generating || isDemoUser}
          className="bg-accent text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {generating ? t("generating") : isDemoUser ? t("demoLocked") : t("generate")}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!plan && !generating && (
        <div className="text-center py-16">
          <span className="text-5xl">📋</span>
          <p className="mt-4 text-text-secondary">{t("noPlan")}</p>
          <p className="text-sm text-text-secondary mt-1">{t("noPlanHint")}</p>
        </div>
      )}

      {generating && (
        <div className="text-center py-16">
          <span className="text-5xl animate-bounce">🤔</span>
          <p className="mt-4 text-text-secondary">{t("generatingDesc")}</p>
        </div>
      )}

      {plan && !generating && (
        <MealPlanGrid plan={plan} onSlotClick={(day, meal) => setDetail({ day, meal })} />
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
        onNavigateTo={(path) => router?.push(path)}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(false)}>
          <div className="bg-card rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <p className="text-sm text-text-primary font-medium mb-1">{t("confirmDeleteTitle")}</p>
            <p className="text-sm text-text-secondary">{t("confirmDeleteDesc", { title: detail && plan ? getSlot(detail.day, detail.meal)?.recipe?.title || "" : "" })}</p>
            <p className="text-xs text-text-secondary mt-2">{t("irreversible")}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 bg-surface text-text-secondary py-2 rounded-xl text-sm">{tc("cancel")}</button>
              <button onClick={() => { setDeleteConfirm(false); confirmDelete() }} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm">{t("confirmDelete")}</button>
            </div>
          </div>
        </div>
      )}

      {starToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-bg-inverse text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          {starToast}
        </div>
      )}

      {/* 选天数弹窗 */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowPicker(false)}>
          <div className="bg-card rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-text-primary mb-1">{t("generate")}</h3>
            <p className="text-sm text-text-secondary mb-4">{t("pickerHint")}</p>

            <div className="grid grid-cols-7 gap-2 mb-3">
              {DAYS.map((key, i) => {
                let cls = "rounded-lg border py-3 text-center text-sm font-medium cursor-pointer transition-all "
                if (pickStart !== null && pickEnd !== null) {
                  const lo = Math.min(pickStart, pickEnd)
                  const hi = Math.max(pickStart, pickEnd)
                  if (i >= lo && i <= hi) {
                    cls += i === lo || i === hi ? "bg-accent text-white border-accent" : "bg-orange-50 text-accent border-accent"
                  } else {
                    cls += "bg-white text-text-secondary border-gray-200 hover:border-accent"
                  }
                } else if (i === pickStart) {
                  cls += "bg-accent text-white border-accent"
                } else {
                  cls += "bg-white text-text-secondary border-gray-200 hover:border-accent"
                }
                return (
                  <button key={key} className={cls} onClick={() => handleDayClick(i)}>
                    <div className="text-xs">{t(key).slice(0, 1)}</div>
                  </button>
                )
              })}
            </div>

            <div className="text-xs text-text-secondary mb-4 min-h-[20px]">
              {pickStart === null
                ? t("pickerSelectStart")
                : pickEnd === null
                  ? t("pickerSelectEnd")
                  : (() => {
                      const lo = Math.min(pickStart, pickEnd)
                      const hi = Math.max(pickStart, pickEnd)
                      const n = hi - lo + 1
                      const names = DAYS.slice(lo, hi + 1).map((k) => t(k)).join("、")
                      let tip = ""
                      if (n >= 6) tip = `<br><span class="text-text-secondary">💡 ${t("pickerTip")}</span>`
                      return `${t("pickerRange", { start: t(DAYS[lo]), end: t(DAYS[hi]), count: n, meals: n * 3 })}：${names}${tip}`
                    })()}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowPicker(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-text-secondary hover:bg-gray-200 transition-colors">{tc("cancel")}</button>
              <button onClick={confirmGenerate} disabled={pickStart === null || pickEnd === null} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-accent text-white disabled:bg-orange-200 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors">{t("confirmGenerate")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}