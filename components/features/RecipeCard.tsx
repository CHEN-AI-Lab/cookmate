"use client"

interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  cookingTime: number
  calories: number
  cuisineType: string
  difficulty: string
}

interface RecipeCardProps {
  recipe: Recipe
  index: number | string
  isStarred: boolean
  onToggleStar: (recipe: Recipe) => void
  onAddToPlan: (recipe: Recipe) => void
  onDelete: (recipe: Recipe) => void
  isFromPantry: (ingredientName: string) => boolean
  expanded: boolean
  onToggleExpand: () => void
}

function diffColor(d: string) {
  switch (d) {
    case "easy":
      return "text-green-600 bg-green-50"
    case "medium":
      return "text-yellow-600 bg-yellow-50"
    case "hard":
      return "text-red-600 bg-red-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}

function difficultyLabel(d: string) {
  const lower = d?.toLowerCase() ?? ""
  if (["easy", "简单"].includes(lower)) return "简单"
  if (["medium", "中等"].includes(lower)) return "中等"
  return d || "中等"
}

export function RecipeCard({
  recipe,
  index,
  isStarred,
  onToggleStar,
  onAddToPlan,
  onDelete,
  isFromPantry,
  expanded,
  onToggleExpand,
}: RecipeCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden transition-all">
      <div
        onClick={onToggleExpand}
        className="w-full text-left p-6 flex items-start justify-between hover:bg-orange-50/30 transition-colors cursor-pointer"
      >
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍽️</span>
              <h3 className="text-lg font-bold text-[#2D3436]">{recipe.title}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStar(recipe)
                }}
                className={`transition-colors ${
                  isStarred ? "text-amber-400" : "text-gray-300 hover:text-amber-400"
                }`}
                title={isStarred ? "取消收藏" : "收藏菜谱"}
              >
                {isStarred ? "⭐" : "☆"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(recipe)
                }}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                title="删除菜谱"
              >
                🗑️
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs">
              <span>⏱ {recipe.cookingTime}分钟</span>
              <span>🔥 {recipe.calories}卡</span>
              <span>{recipe.cuisineType}</span>
              <span className={`px-2 py-0.5 rounded-full ${diffColor(recipe.difficulty)}`}>
                {difficultyLabel(recipe.difficulty)}
              </span>
            </div>
          </div>
        </div>
        <span className="text-gray-400 ml-4">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="mt-4">
            <p className="text-sm font-medium text-[#2D3436] mb-2">🥄 食材</p>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                  {ing}
                  {isFromPantry(ing.split(" ")[0]) && (
                    <span className="text-[10px] text-green-500 bg-green-50 px-1 rounded">
                      食材库有
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-[#2D3436] mb-2">👨‍🍳 步骤</p>
            <ol className="space-y-2">
              {recipe.steps.map((step, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-[#FF6B35] font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <button
            onClick={() => onAddToPlan(recipe)}
            className="mt-4 bg-orange-50 text-[#FF6B35] px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-100 transition-colors"
          >
            📅 加入周计划
          </button>
        </div>
      )}
    </div>
  )
}