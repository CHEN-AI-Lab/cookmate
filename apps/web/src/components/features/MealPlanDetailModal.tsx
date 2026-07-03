"use client"

interface MealPlanRecipe {
  id?: string
  title: string
  description?: string
  ingredients?: string
  steps?: string
  cookingTime?: number
  calories?: number
  starred?: boolean
}

interface MealPlanSlot {
  recipe: MealPlanRecipe | null
}

interface MealPlanDetailModalProps {
  open: boolean
  onClose: () => void
  day: number
  meal: string
  slot: MealPlanSlot | undefined
  dayLabels: string[]
  mealLabels: Record<string, string>
  onToggleStar: (recipeId: string) => void
  onDeleteSlot: () => void
  onNavigateTo: (path: string) => void
}

export function MealPlanDetailModal({
  open,
  onClose,
  day,
  meal,
  slot,
  dayLabels,
  mealLabels,
  onToggleStar,
  onDeleteSlot,
  onNavigateTo,
}: MealPlanDetailModalProps) {
  if (!open) return null

  const hasRecipe =
    slot?.recipe?.title ||
    slot?.recipe?.ingredients ||
    slot?.recipe?.steps ||
    slot?.recipe?.cookingTime ||
    slot?.recipe?.calories

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-96 shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">
            {dayLabels[day]} · {mealLabels[meal]}
          </p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {hasRecipe ? (
          <div className="space-y-3">
            {/* Title + Star */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#2D3436] text-lg">
                {slot?.recipe?.title}
              </h3>
              {slot?.recipe?.id && (
                <button
                  onClick={() => onToggleStar(slot.recipe!.id!)}
                  className={`transition-colors text-lg ${
                    slot?.recipe?.starred
                      ? "text-amber-400"
                      : "text-gray-300 hover:text-amber-400"
                  }`}
                  title={slot?.recipe?.starred ? "取消收藏" : "收藏菜谱"}
                >
                  {slot?.recipe?.starred ? "⭐" : "☆"}
                </button>
              )}
            </div>

            {/* Cooking time */}
            {slot?.recipe?.cookingTime && (
              <p className="text-sm text-gray-600">
                ⏱ 烹饪时间：{slot.recipe.cookingTime} 分钟
              </p>
            )}

            {/* Calories */}
            {slot?.recipe?.calories && (
              <p className="text-sm text-gray-600">
                🔥 热量：{slot.recipe.calories} 千卡
              </p>
            )}

            {/* Ingredients */}
            {slot?.recipe?.ingredients && (
              <div>
                <p className="text-sm font-semibold text-[#2D3436] mb-1">
                  🥦 食材清单
                </p>
                <p className="text-sm text-gray-600">
                  {slot.recipe.ingredients.split(", ").join("、")}
                </p>
              </div>
            )}

            {/* Steps */}
            {slot?.recipe?.steps && (
              <div>
                <p className="text-sm font-semibold text-[#2D3436] mb-1">
                  📝 做法步骤
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  {slot.recipe.steps.split("\n").map((step, idx) => (
                    <p key={idx}>
                      {idx + 1}. {step}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-gray-100" />

            {/* Delete button */}
            <button
              onClick={onDeleteSlot}
              className="w-full py-2 rounded-xl text-sm border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              ✕ 删掉这个菜
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="py-6 text-center space-y-4">
            <p className="text-gray-500 text-sm">未安排菜品</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              💡 去 🤖 AI 菜谱 或 📚 我的菜谱 生成菜谱后，再添加到周计划
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => onNavigateTo("/app/recipes")}
                className="flex-1 py-2.5 rounded-xl text-sm bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:opacity-90 transition-opacity"
              >
                🤖 去 AI 菜谱
              </button>
              <button
                onClick={() => onNavigateTo("/app/my-recipes")}
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
}