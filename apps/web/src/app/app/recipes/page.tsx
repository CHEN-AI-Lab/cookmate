"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { RecipeCard } from "@/components/features/RecipeCard"

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

interface PantryItem {
  id: string
  name: string
}

const DAY_VALUES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const
const MEAL_VALUES = ["早餐", "午餐", "晚餐"] as const

export default function RecipesPage() {
  const t = useTranslations("recipes")
  const tmeal = useTranslations("mealPlan")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ingredients, setIngredients] = useState<string[]>(() => {
    const fromUrl = searchParams.get("ingredients")
    return fromUrl ? fromUrl.split(",").filter(Boolean) : []
  })
  const [input, setInput] = useState("")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)
  const [addDialog, setAddDialog] = useState<{ recipe: Recipe; day: string; meal: string } | null>(null)
  const [addMsg, setAddMsg] = useState("")
  const [conflictData, setConflictData] = useState<{ existingTitle: string; recipe: Recipe; day: string; meal: string } | null>(null)
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set())
  const [starToast, setStarToast] = useState("")
  const [dupDialog, setDupDialog] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<Recipe | null>(null)
  const [deleteError, setDeleteError] = useState("")
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [pantryLoaded, setPantryLoaded] = useState(false)
  const [isDemoUser, setIsDemoUser] = useState(false)
  const [demoToast, setDemoToast] = useState("")

  const dayLabel: Record<string, string> = {
    "周一": tmeal("monday"),
    "周二": tmeal("tuesday"),
    "周三": tmeal("wednesday"),
    "周四": tmeal("thursday"),
    "周五": tmeal("friday"),
    "周六": tmeal("saturday"),
    "周日": tmeal("sunday"),
  }

  const mealLabel: Record<string, string> = {
    "早餐": tmeal("breakfast"),
    "午餐": tmeal("lunch"),
    "晚餐": tmeal("dinner"),
  }

  useEffect(() => {
    fetch("/api/recipes/star")
      .then((r) => r.json())
      .then((data) => {
        if (data.recipes) setStarredIds(new Set(data.recipes.map((r: { id: string }) => r.id)))
      })
      .catch((err) => console.error("load starred recipes error:", err))
  }, [])

  const toggleStar = async (recipe: Recipe) => {
    const res = await fetch("/api/recipes/star", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: recipe.id }),
    })
    const data = await res.json()
    if (data.success) {
      setStarredIds((prev) => {
        const next = new Set(prev)
        if (data.starred) {
          next.add(String(recipe.id))
        } else {
          next.delete(String(recipe.id))
        }
        return next
      })
      setStarToast(data.starred ? t("starToast") : t("unstarToast"))
      setTimeout(() => setStarToast(""), 2500)
    }
  }

  const deleteRecipe = async (recipe: Recipe) => {
    const res = await fetch(`/api/recipes/${recipe.id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setRecipes(recipes.filter((r) => String(r.id) !== String(recipe.id)))
      setDeleteDialog(null)
    } else {
      const data = await res.json()
      setDeleteError(data.error || t("errorUnknown"))
      setTimeout(() => setDeleteError(""), 2500)
    }
  }

  useEffect(() => {
    fetch("/api/pantry")
      .then((r) => r.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setPantryItems(data.items)
        }
      })
      .catch((err) => console.error("load pantry error:", err))
      .finally(() => setPantryLoaded(true))
  }, [])

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.isDemoUser) setIsDemoUser(true)
      })
      .catch((err) => console.error("load profile error:", err))
  }, [])

  const addToPlan = async (recipe: Recipe) => {
    const dialogSnapshot = addDialog
    const day = dialogSnapshot?.day || DAY_VALUES[0]
    const meal = dialogSnapshot?.meal || MEAL_VALUES[0]
    setAddDialog(null)
    const res = await fetch("/api/meal-plan/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: recipe.title,
        description: recipe.description,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join("、") : String(recipe.ingredients || ""),
        steps: Array.isArray(recipe.steps) ? recipe.steps.join("\n") : String(recipe.steps || ""),
        cookingTime: recipe.cookingTime || 0,
        calories: recipe.calories || 0,
        cuisineType: recipe.cuisineType || "",
        dayOfWeek: day,
        mealTime: meal,
      }),
    })
    const data = await res.json()
    if (data.conflict) {
      setConflictData({ existingTitle: data.existingTitle, recipe, day, meal })
    } else if (data.success) {
      setAddMsg(t("addedToPlanWithTitle", { title: recipe.title, day: dayLabel[day] || day, meal: mealLabel[meal] || meal }))
    } else {
      setAddMsg(`❌ ${data.error || t("errorAddFailed")}`)
    }
    setTimeout(() => setAddMsg(""), 3000)
  }

  const confirmOverwrite = async () => {
    if (!conflictData) return
    const r = await fetch("/api/meal-plan/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: conflictData.recipe.title,
        description: conflictData.recipe.description,
        ingredients: Array.isArray(conflictData.recipe.ingredients) ? conflictData.recipe.ingredients.join("、") : String(conflictData.recipe.ingredients || ""),
        steps: Array.isArray(conflictData.recipe.steps) ? conflictData.recipe.steps.join("\n") : String(conflictData.recipe.steps || ""),
        cookingTime: conflictData.recipe.cookingTime || 0,
        calories: conflictData.recipe.calories || 0,
        cuisineType: conflictData.recipe.cuisineType || "",
        dayOfWeek: conflictData.day,
        mealTime: conflictData.meal,
        overwrite: true,
      }),
    })
    const d = await r.json()
    if (d.success) {
      setAddMsg(t("replacedSlot", { day: dayLabel[conflictData.day] || conflictData.day, meal: mealLabel[conflictData.meal] || conflictData.meal }))
    } else {
      setAddMsg(`❌ ${d.error || t("errorReplaceFailed")}`)
    }
    setTimeout(() => setAddMsg(""), 3000)
    setConflictData(null)
  }

  const addIngredient = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    if (ingredients.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      setDupDialog(trimmed)
      setTimeout(() => setDupDialog(null), 2500)
      setInput("")
      return
    }
    setIngredients([...ingredients, trimmed])
    setInput("")
  }

  const removeIngredient = (item: string) => {
    setIngredients(ingredients.filter((i) => i !== item))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addIngredient()
    }
  }

  const importPantryItem = (name: string) => {
    const exists = ingredients.some((i) => i.toLowerCase() === name.toLowerCase())
    if (exists) {
      setIngredients(ingredients.filter((i) => i.toLowerCase() !== name.toLowerCase()))
    } else {
      setIngredients([...ingredients, name])
    }
  }

  const importAllPantry = () => {
    const merged = [...ingredients]
    for (const item of pantryItems) {
      const exists = merged.some((i) => i.toLowerCase() === item.name.toLowerCase())
      if (!exists) {
        merged.push(item.name)
      }
    }
    setIngredients(merged)
  }

  const isFromPantry = (name: string) => pantryItems.some((i) => i.name.toLowerCase() === name.toLowerCase())

  const generateRecipes = async () => {
    if (isDemoUser) {
      setDemoToast(t("demoCannotGenerate"))
      setTimeout(() => setDemoToast(""), 3000)
      return
    }
    if (ingredients.length === 0) {
      setError(t("errorAtLeastOneIngredient"))
      return
    }
    setLoading(true)
    setError("")
    setRecipes([])
    setGenerated(false)

    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients,
          pantryContext: pantryItems.map((i) => i.name),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t("errorGenerateFailed"))
      } else {
        setRecipes(data.recipes || [])
        setGenerated(true)
      }
    } catch (err) {
      console.error("generate recipes error:", err)
      setError(t("networkError"))
    } finally {
      setLoading(false)
    }
  }

  const diffColor = (d: string) => {
    switch (d) {
      case "easy": return "text-green-600 bg-green-50"
      case "medium": return "text-yellow-600 bg-yellow-50"
      case "hard": return "text-red-600 bg-red-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  const fromPantryCount = ingredients.filter((i) => isFromPantry(i)).length

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#2D3436] mb-6">{t("aiRecipesTitle")}</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-green-50 p-6 mb-6">
        {pantryLoaded && pantryItems.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                <span>📦</span> {t("yourPantry")}
                <span className="text-gray-400 font-normal">{t("clickToAdd")}</span>
              </p>
              {ingredients.length > 0 && fromPantryCount > 0 && (
                <button
                  onClick={importAllPantry}
                  className="text-xs text-[#FF6B35] hover:text-orange-600 font-medium"
                >
                  {t("importAll")}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {pantryItems.map((item) => {
                const active = ingredients.includes(item.name)
                return (
                  <button
                    key={item.id}
                    onClick={() => importPantryItem(item.name)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                      active
                        ? "bg-green-50 text-green-700 border-green-300 shadow-sm"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-600 hover:bg-green-50/30"
                    }`}
                  >
                    {item.name}
                    {active && (
                      <span className="ml-0.5 text-green-500">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pantryItems.length > 0 ? t("ingredientsPlaceholderPantry") : t("ingredientsPlaceholder")}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#FF6B35] text-sm"
            />
            <button
              onClick={addIngredient}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm"
            >
              {t("addIngredientBtn")}
            </button>
          </div>

          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {ingredients.map((item) => (
                <span
                  key={item}
                  className={`px-3 py-1 rounded-full text-sm border flex items-center gap-1 ${
                    isFromPantry(item)
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-orange-50 text-[#FF6B35] border-orange-200"
                  }`}
                >
                  {item}
                  {isFromPantry(item) && <span className="text-[10px] opacity-60">📦</span>}
                  <button onClick={() => removeIngredient(item)} className="ml-1 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={generateRecipes}
              disabled={loading}
              className="bg-[#FF6B35] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? t("aiThinking") : t("aiRecommend")}
            </button>
            {ingredients.length > 0 && (
              <button
                onClick={() => setIngredients([])}
                className="text-gray-400 px-4 py-2.5 rounded-full text-sm hover:text-gray-600 transition-colors"
              >
                {t("clearAll")}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-4xl animate-bounce">🤔</p>
          <p className="mt-4 text-gray-500">{t("aiAnalyzing")}</p>
        </div>
      )}

      {recipes.length > 0 && (
        <div className="space-y-4">
          {recipes.map((recipe, idx) => (
            <RecipeCard
              key={idx}
              recipe={recipe}
              index={idx}
              isStarred={starredIds.has(recipe.id?.toString() || "")}
              onToggleStar={toggleStar}
              onAddToPlan={(r) => setAddDialog({ recipe: r, day: DAY_VALUES[0], meal: MEAL_VALUES[0] })}
              onDelete={(r) => setDeleteDialog(r)}
              isFromPantry={isFromPantry}
              expanded={expanded === `${idx}`}
              onToggleExpand={() => setExpanded(expanded === `${idx}` ? null : `${idx}`)}
            />
          ))}
        </div>
      )}

      {!loading && recipes.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-5xl">{generated ? "🤷" : "🥗"}</span>
          <p className="mt-4">
            {generated
              ? t("emptyGenerated")
              : pantryItems.length > 0
                ? t("emptyHasPantry")
                : t("emptyDefault")}
          </p>
        </div>
      )}

      {addDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setAddDialog(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#2D3436] mb-4">{t("addToPlan")}</h3>
            <p className="text-sm text-gray-500 mb-4">{t("addToPlanDesc", { title: addDialog.recipe.title })}</p>
            <div className="flex gap-2 mb-3">
              <select value={addDialog.day} onChange={(e) => setAddDialog({ ...addDialog, day: e.target.value })}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {DAY_VALUES.map((d) => (
                  <option key={d} value={d}>{dayLabel[d]}</option>
                ))}
              </select>
              <select value={addDialog.meal} onChange={(e) => setAddDialog({ ...addDialog, meal: e.target.value })}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {MEAL_VALUES.map((m) => (
                  <option key={m} value={m}>{mealLabel[m]}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAddDialog(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">{t("cancel")}</button>
              <button onClick={() => addToPlan(addDialog.recipe)} className="flex-1 bg-[#FF6B35] text-white py-2 rounded-xl text-sm">{t("confirmAdd")}</button>
            </div>
          </div>
        </div>
      )}

      {dupDialog && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-[15vh]">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-5 py-3.5 text-sm flex items-center gap-2.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <span className="text-amber-500 text-base shrink-0">⚠️</span>
            <span className="text-gray-700">{t("alreadyInIngredients", { name: dupDialog })}</span>
          </div>
        </div>
      )}

      {conflictData && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setConflictData(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg mb-2">⚠️</p>
            <p className="text-sm text-[#2D3436] font-medium mb-1">{t("slotConflict")}</p>
            <p className="text-sm text-gray-500">{t("slotConflictDesc", { day: dayLabel[conflictData.day] || conflictData.day, meal: mealLabel[conflictData.meal] || conflictData.meal, title: conflictData.existingTitle })}</p>
            <p className="text-xs text-gray-400 mt-2">{t("slotConflictReplace", { title: conflictData.recipe.title })}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConflictData(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">{t("cancel")}</button>
              <button onClick={confirmOverwrite} className="flex-1 bg-[#FF6B35] text-white py-2 rounded-xl text-sm">{t("replace")}</button>
            </div>
          </div>
        </div>
      )}

      {deleteDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setDeleteDialog(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <p className="text-sm text-[#2D3436] font-medium mb-1">{t("confirmDelete")}</p>
            <p className="text-sm text-gray-500">{t("confirmDeleteDesc", { title: deleteDialog.title })}</p>
            <p className="text-xs text-gray-400 mt-2">{t("irreversible")}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteDialog(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">{t("cancel")}</button>
              <button onClick={() => deleteRecipe(deleteDialog)} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm">{t("confirmDeleteAction")}</button>
            </div>
          </div>
        </div>
      )}

      {addMsg && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-[15vh]">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-5 py-3.5 text-sm flex items-center gap-2.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <span className="text-gray-700">{addMsg}</span>
          </div>
        </div>
      )}

      {starToast && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-[15vh]">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-5 py-3.5 text-sm flex items-center gap-2.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <span className="text-gray-700">{starToast}</span>
          </div>
        </div>
      )}

      {demoToast && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-[15vh]">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-5 py-3.5 text-sm flex items-center gap-2.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <span className="text-gray-700">{demoToast}</span>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-[15vh]">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-5 py-3.5 text-sm flex items-center gap-2.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <span className="text-red-500 text-base shrink-0">❌</span>
            <span className="text-gray-700">{deleteError}</span>
          </div>
        </div>
      )}
    </div>
  )
}