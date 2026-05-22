"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface Recipe {
  id: string | number
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

export default function RecipesPage() {
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
  // 重复添加弹窗
  const [dupDialog, setDupDialog] = useState<string | null>(null)
  // 菜谱删除
  const [deleteDialog, setDeleteDialog] = useState<Recipe | null>(null)
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  // 食材库相关
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
  const [pantryLoaded, setPantryLoaded] = useState(false)

  // 加载已收藏的菜谱
  useEffect(() => {
    fetch("/api/recipes/star")
      .then((r) => r.json())
      .then((data) => {
        if (data.recipes) setStarredIds(new Set(data.recipes.map((r: any) => r.id)))
      })
      .catch(() => {})
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
      setStarToast(data.starred ? "⭐ 已收藏" : "已取消收藏")
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
      alert(`删除失败: ${data.error || "未知错误"}`)
    }
  }

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return
    const res = await fetch("/api/recipes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    })
    if (res.ok) {
      setRecipes(recipes.filter((r) => !selectedIds.has(String(r.id))))
      setSelectedIds(new Set())
      setSelectMode(false)
    } else {
      const data = await res.json()
      alert(`批量删除失败: ${data.error || "未知错误"}`)
    }
  }

  const toggleSelect = (recipe: Recipe) => {
    const id = String(recipe.id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === recipes.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(recipes.map((r) => String(r.id))))
    }
  }

  // 页面加载时自动拉食材库
  useEffect(() => {
    fetch("/api/pantry")
      .then((r) => r.json())
      .then((data) => {
        if (data.items && data.items.length > 0) {
          setPantryItems(data.items)
        }
      })
      .catch(() => {})
      .finally(() => setPantryLoaded(true))
  }, [])

  const addToPlan = async (recipe: Recipe) => {
    const dialogSnapshot = addDialog
    const day = dialogSnapshot?.day || "周一"
    const meal = dialogSnapshot?.meal || "午餐"
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
      setAddMsg(`✅ "${recipe.title}" 已加入 ${day} ${meal}`)
    } else {
      setAddMsg(`❌ ${data.error || "添加失败"}`)
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
      setAddMsg(`✅ 已替换 ${conflictData.day}${conflictData.meal}`)
    } else {
      setAddMsg(`❌ ${d.error || "替换失败"}`)
    }
    setTimeout(() => setAddMsg(""), 3000)
    setConflictData(null)
  }

  const addIngredient = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    if (ingredients.includes(trimmed)) {
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

  // 从食材库导入单个食材
  const importPantryItem = (name: string) => {
    if (ingredients.includes(name)) {
      setIngredients(ingredients.filter((i) => i !== name))
    } else {
      setIngredients([...ingredients, name])
    }
  }

  // 一键导入全部食材库
  const importAllPantry = () => {
    const names = pantryItems.map((i) => i.name)
    const merged = [...new Set([...ingredients, ...names])]
    setIngredients(merged)
  }

  // 检查食材是否来自食材库
  const isFromPantry = (name: string) => pantryItems.some((i) => i.name === name)

  const generateRecipes = async () => {
    if (ingredients.length === 0) {
      setError("请至少添加一种食材")
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
          // 把整个食材库传给AI，让它知道冰箱里还有啥，可以推荐用掉存货的菜
          pantryContext: pantryItems.map((i) => i.name),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "生成失败，请稍后重试")
      } else {
        setRecipes(data.recipes || [])
        setGenerated(true)
      }
    } catch {
      setError("网络错误，请稍后重试")
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
      <h1 className="text-2xl font-bold text-[#2D3436] mb-6">🍳 AI 菜谱生成</h1>

      {/* ====== 合并区域: 食材库 + 输入 ====== */}
      <div className="bg-white rounded-2xl shadow-sm border border-green-50 p-6 mb-6">
        {/* 食材库快捷选择 */}
        {pantryLoaded && pantryItems.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-green-600 flex items-center gap-1">
                <span>📦</span> 你的食材库
                <span className="text-gray-400 font-normal">（点击即添加）</span>
              </p>
              {ingredients.length > 0 && fromPantryCount > 0 && (
                <button
                  onClick={importAllPantry}
                  className="text-xs text-[#FF6B35] hover:text-orange-600 font-medium"
                >
                  + 一键导入全部
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
              placeholder={pantryItems.length > 0 ? "或手动输入食材..." : "输入食材，如：鸡肉、西兰花"}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#FF6B35] text-sm"
            />
            <button
              onClick={addIngredient}
              className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm"
            >
              + 添加
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
              {loading ? "🤔 AI 正在思考..." : "🍳 AI 推荐菜谱"}
            </button>
            {ingredients.length > 0 && (
              <button
                onClick={() => setIngredients([])}
                className="text-gray-400 px-4 py-2.5 rounded-full text-sm hover:text-gray-600 transition-colors"
              >
                清空
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-4xl animate-bounce">🤔</p>
          <p className="mt-4 text-gray-500">AI 正在分析食材并生成菜谱...</p>
        </div>
      )}

      {recipes.length > 0 && (
        <div className="space-y-4">
          {/* 选择模式工具栏 */}
          {selectMode ? (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-gray-600 hover:text-[#FF6B35]"
                >
                  {selectedIds.size === recipes.length ? "取消全选" : "全选"}
                </button>
                <span className="text-sm text-gray-500">已选 {selectedIds.size} 个</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedIds(new Set()); setSelectMode(false) }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  onClick={() => setBulkDeleteDialog(true)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  删除选中
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <button
                onClick={() => setSelectMode(true)}
                className="text-sm text-gray-500 hover:text-[#FF6B35]"
              >
                多选管理
              </button>
            </div>
          )}

          {recipes.map((recipe, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                selectedIds.has(String(recipe.id)) ? "border-[#FF6B35] ring-2 ring-[#FF6B35]/20" : "border-orange-50"
              }`}
            >
              <div
                onClick={() => setExpanded(expanded === `${idx}` ? null : `${idx}`)}
                className="w-full text-left p-6 flex items-start justify-between hover:bg-orange-50/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 flex-1">
                  {/* 选择框 */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(String(recipe.id))}
                    onChange={(e) => { e.stopPropagation(); toggleSelect(recipe); }}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35] cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🍽️</span>
                      <h3 className="text-lg font-bold text-[#2D3436]">{recipe.title}</h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(recipe); }}
                        className={`transition-colors ${starredIds.has(recipe.id?.toString() || "") ? "text-amber-400" : "text-gray-300 hover:text-amber-400"}`}
                        title={starredIds.has(recipe.id?.toString() || "") ? "取消收藏" : "收藏菜谱"}
                      >
                        {starredIds.has(recipe.id?.toString() || "") ? "⭐" : "☆"}
                      </button>
                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteDialog(recipe); }}
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
                        {(["easy","简单"]).includes(recipe.difficulty?.toLowerCase()) ? "简单" : (["medium","中等"]).includes(recipe.difficulty?.toLowerCase()) ? "中等" : recipe.difficulty || "中等"}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-gray-400 ml-4">{expanded === `${idx}` ? "▲" : "▼"}</span>
              </div>

              {expanded === `${idx}` && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="mt-4">
                    <p className="text-sm font-medium text-[#2D3436] mb-2">🥄 食材</p>
                    <ul className="space-y-1">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                          {ing}
                          {isFromPantry(ing.split(" ")[0]) && (
                            <span className="text-[10px] text-green-500 bg-green-50 px-1 rounded">食材库有</span>
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
                    onClick={() => setAddDialog({ recipe, day: "周一", meal: "午餐" })}
                    className="mt-4 bg-orange-50 text-[#FF6B35] px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-100 transition-colors"
                  >
                    📅 加入周计划
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && recipes.length === 0 && !error && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-5xl">{generated ? "🤷" : "🥗"}</span>
          <p className="mt-4">
            {generated
              ? "AI 无法为这些食材生成菜谱，试试输入其他真实的食材"
              : pantryItems.length > 0
                ? "👆 从上面食材库点击食材或手动输入，让 AI 为你的冰箱量身推荐菜谱"
                : "添加食材，让 AI 为你推荐菜谱"}
          </p>
        </div>
      )}

      {/* 加入周计划弹窗 */}
      {addDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setAddDialog(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#2D3436] mb-4">📅 加入周计划</h3>
            <p className="text-sm text-gray-500 mb-4">"{addDialog.recipe.title}" 加入</p>
            <div className="flex gap-2 mb-3">
              <select value={addDialog.day} onChange={(e) => setAddDialog({ ...addDialog, day: e.target.value })}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {["周一","周二","周三","周四","周五","周六","周日"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select value={addDialog.meal} onChange={(e) => setAddDialog({ ...addDialog, meal: e.target.value })}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm">
                {["早餐","午餐","晚餐"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAddDialog(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">取消</button>
              <button onClick={() => addToPlan(addDialog.recipe)} className="flex-1 bg-[#FF6B35] text-white py-2 rounded-xl text-sm">确认加入</button>
            </div>
          </div>
        </div>
      )}

      {/* 重复添加提示 */}
      {dupDialog && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-[15vh]">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-5 py-3.5 text-sm flex items-center gap-2.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <span className="text-amber-500 text-base shrink-0">⚠️</span>
            <span className="text-gray-700">「{dupDialog}」已在食材列表中</span>
          </div>
        </div>
      )}

      {conflictData && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setConflictData(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg mb-2">⚠️</p>
            <p className="text-sm text-[#2D3436] font-medium mb-1">该时段已有菜谱</p>
            <p className="text-sm text-gray-500">{conflictData.day}{conflictData.meal} 已有「{conflictData.existingTitle}」</p>
            <p className="text-xs text-gray-400 mt-2">要替换成「{conflictData.recipe.title}」吗？</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConflictData(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">取消</button>
              <button onClick={confirmOverwrite} className="flex-1 bg-[#FF6B35] text-white py-2 rounded-xl text-sm">替换</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 - 单个菜谱 */}
      {deleteDialog && selectedIds.size <= 1 && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setDeleteDialog(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg mb-2">🗑️</p>
            <p className="text-sm text-[#2D3436] font-medium mb-1">确认删除</p>
            <p className="text-sm text-gray-500">确定要删除「{deleteDialog.title}」吗？</p>
            <p className="text-xs text-gray-400 mt-2">此操作不可恢复</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteDialog(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">取消</button>
              <button onClick={() => deleteRecipe(deleteDialog)} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 - 批量删除 */}
      {bulkDeleteDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setBulkDeleteDialog(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg mb-2">🗑️</p>
            <p className="text-sm text-[#2D3436] font-medium mb-1">批量删除确认</p>
            <p className="text-sm text-gray-500">确定要删除选中的 <strong>{selectedIds.size}</strong> 个菜谱吗？</p>
            <p className="text-xs text-gray-400 mt-2">此操作不可恢复</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setBulkDeleteDialog(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">取消</button>
              <button onClick={deleteSelected} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {addMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D3436] text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          {addMsg}
        </div>
      )}

      {starToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#2D3436] text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          {starToast}
        </div>
      )}
    </div>
  )
}