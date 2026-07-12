"use client"
import { useTranslations, useLocale } from "next-intl"

const MEAL_TYPES = ["breakfast", "lunch", "dinner"]
const MEAL_EMOJIS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
}

interface MealPlanSlotRecipe {
  title: string
  cookingTime?: number
  starred?: boolean
}

interface MealPlanSlot {
  id: string
  dayOfWeek: number
  mealType: string
  recipe: MealPlanSlotRecipe | null
  note: string | null
}

interface MealPlan {
  slots: MealPlanSlot[]
}

interface MealPlanGridProps {
  plan: MealPlan
  onSlotClick: (day: number, meal: string) => void
}

export function MealPlanGrid({ plan, onSlotClick }: MealPlanGridProps) {
  const t = useTranslations("mealPlan")
  const locale = useLocale()
  const timeSuffix = locale === "en" || locale.startsWith("en") ? " min" : " 分钟"
  const DAY_LABELS = [
    t("monday"), t("tuesday"), t("wednesday"),
    t("thursday"), t("friday"), t("saturday"), t("sunday"),
  ]
  const MEAL_LABELS: Record<string, string> = {
    breakfast: t("breakfast"),
    lunch: t("lunch"),
    dinner: t("dinner"),
  }

  return (
    <div className="space-y-3">
      {DAY_LABELS.map((day, dayIdx) => (
        <div
          key={day}
          className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden"
        >
          <div className="bg-orange-50 px-4 py-2 font-bold text-[#2D3436] text-sm">{day}</div>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {MEAL_TYPES.map((meal) => {
              const slot = plan.slots.find(
                (s) => s.dayOfWeek === dayIdx && s.mealType === meal
              )
              return (
                <button
                  key={meal}
                  onClick={() => onSlotClick(dayIdx, meal)}
                  className="p-3 text-left hover:bg-orange-50/50 transition-colors min-h-[70px]"
                >
                  <p className="text-xs text-gray-400 mb-1">
                    {MEAL_EMOJIS[meal]} {MEAL_LABELS[meal]}
                  </p>
                  {slot?.recipe ? (
                    <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-medium text-[#2D3436] truncate min-w-0">
                          {slot.recipe.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {slot.recipe.starred && (
                            <span className="text-amber-400 text-xs">⭐</span>
                          )}
                          {slot.recipe.cookingTime && (
                            <span className="text-xs text-gray-400">
                              ⏱{slot.recipe.cookingTime}{timeSuffix}
                            </span>
                          )}
                        </div>
                      </div>
                  ) : (
                    <p className="text-xs text-gray-300">{t("emptySlot")}</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}