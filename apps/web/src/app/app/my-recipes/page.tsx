"use client"

import { useState, useEffect, useCallback } from "react"
import { getDemoRecipes } from "@cookmate/shared/demo-data"

interface Recipe {
  id: string
  title: string
  description: string | null
  ingredients: string
  steps: string
  cookingTime: number | null
  calories: number | null
  cuisineType: string | null
  difficulty: string | null
  starred: boolean
  createdAt: string
}

export default function MyRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addDialog, setAddDialog] = useState<{ recipeId: string; title: string } | null>(null)
  const [addDay, setAddDay] = useState("周一")
  const [addMeal, setAddMeal] = useState("午餐")
  const [addMsg, setAddMsg] = useState("")
  const [conflictData, setConflictData] = useState<{ existingTitle: string; recipe: Recipe } | null>(null)
  const [toast, setToast] = useState("")
  const [filter, setFilter] = useState<"all" | "starred">("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<Recipe[] | null>(null)
  const [isDemoUser, setIsDemoUser] = useState(false)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2500)
  }, [])

  const loadRecipes = async () => {
    try {
      const res = await fetch("/api/recipes")
      const data = await res.json()
      if (data.recipes) {
        // 收藏的排在前面
        const sorted = [...data.recipes].sort((a: Recipe, b: Recipe) => {
          if (a.starred && !b.starred) return -1
          if (!a.starred && b.starred) return 1
          return 0
        })
        setRecipes(sorted)
      }
    } catch (err) { console.error("load recipes error:", err) } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecipes() }, [])

  // Check demo user and pre-fill demo recipes
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.isDemoUser) {
          setIsDemoUser(true)
          setTimeout(() => {
            setRecipes((prev) => prev.length > 0 ? prev : getDemoRecipes())
          }, 500)
        }
      })
      .catch((err) => console.error("load profile error:", err))
  }, [])

  const toggleStar = async (recipeId: string) => {
    if (isDemoUser) {
      showToast("🔒 体验用户无法修改，请注册后使用")
      return
    }
    const res = await fetch("/api/recipes/star", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId }),
    })
    const data = await res.json()
    if (data.success) {
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, starred: data.starred } : r))
          .sort((a, b) => {
            if (a.starred && !b.starred) return -1
            if (!a.starred && b.starred) return 1
            return 0
          })
      )
      showToast(data.starred ? "⭐ 已收藏" : "已取消收藏")
    }
  }

  const toggleSelect = (recipeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(recipeId)) next.delete(recipeId)
      else next.add(recipeId)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map((r) => r.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const deleteRecipes = async () => {
    if (isDemoUser) {
      showToast("🔒 体验用户无法删除，请注册后使用")
      setDeleteDialog(null)
      return
    }
    if (!deleteDialog) return
    const toDelete = deleteDialog
    const res = await fetch("/api/recipes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: toDelete.map((r) => r.id) }),
    })
    const data = await res.json()
    if (data.success) {
      setRecipes((prev) => prev.filter((r) => !toDelete.find((d) => d.id === r.id)))
      setSelectedIds(new Set())
      setIsSelectMode(false)
      showToast(`✅ 已删除 ${toDelete.length} 个菜谱`)
    } else {
      showToast(`❌ ${data.error || "删除失败"}`)
    }
    setDeleteDialog(null)
  }

  const addToPlan = async (recipe: Recipe) => {
    const res = await fetch("/api/meal-plan/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: recipe.title,
        description: recipe.description || "",
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join("、") : String(recipe.ingredients || ""),
        steps: Array.isArray(recipe.steps) ? recipe.steps.join("\n") : String(recipe.steps || ""),
        cookingTime: recipe.cookingTime || 0,
        calories: recipe.calories || 0,
        cuisineType: recipe.cuisineType || "",
        dayOfWeek: addDay,
        mealTime: addMeal,
        starred: recipe.starred,
      }),
    })
    const data = await res.json()
    if (data.conflict) {
      setConflictData({ existingTitle: data.existingTitle, recipe })
    } else if (data.success) {
      setAddMsg(`✅ 已加入 ${addDay}${addMeal}`)
    } else {
      setAddMsg(data.error || "加入失败")
    }
    setTimeout(() => setAddMsg(""), 3000)
    setAddDialog(null)
  }

  const confirmOverwrite = async () => {
    if (!conflictData) return
    const r = await fetch("/api/meal-plan/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: conflictData.recipe.title,
        description: conflictData.recipe.description || "",
        ingredients: Array.isArray(conflictData.recipe.ingredients) ? conflictData.recipe.ingredients.join("、") : String(conflictData.recipe.ingredients || ""),
        steps: Array.isArray(conflictData.recipe.steps) ? conflictData.recipe.steps.join("\n") : String(conflictData.recipe.steps || ""),
        cookingTime: conflictData.recipe.cookingTime || 0,
        calories: conflictData.recipe.calories || 0,
        cuisineType: conflictData.recipe.cuisineType || "",
        dayOfWeek: addDay,
        mealTime: addMeal,
        overwrite: true,
        starred: conflictData.recipe.starred,
      }),
    })
    const d = await r.json()
    if (d.success) {
      setAddMsg(`✅ 已替换 ${addDay}${addMeal}`)
    } else {
      setAddMsg(d.error || "替换失败")
    }
    setTimeout(() => setAddMsg(""), 3000)
    setConflictData(null)
    setAddDialog(null)
  }

  const diffLabel = (d: string | null) => {
    switch (d?.toLowerCase()) {
      case "easy": return "简单"
      case "medium": return "中等"
      case "hard": return "困难"
      default: return d || "中等"
    }
  }

  const filtered = filter === "starred" ? recipes.filter((r) => r.starred) : recipes

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2D3436]">📚 我的菜谱</h1>
        <div className="flex gap-2 items-center">
          {isSelectMode ? (
            <>
              <span className="text-sm text-gray-500">已选 {selectedIds.size} 个</span>
              <button
                onClick={selectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                全选
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                取消全选
              </button>
              <button
                onClick={() => setDeleteDialog(filtered.filter((r) => selectedIds.has(r.id)))}
                disabled={selectedIds.size === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ 删除选中
              </button>
              <button
                onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FF6B35] text-white hover:bg-orange-600 transition-colors"
              >
                完成
              </button>
            </>
          ) : (
            <>
              {!isDemoUser && (
              <button
                onClick={() => setIsSelectMode(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                多选
              </button>
              )}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === "all" ? "bg-white text-[#2D3436] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  全部 ({recipes.length})
                </button>
                <button
                  onClick={() => setFilter("starred")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === "starred" ? "bg-white text-[#2D3436] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ⭐ 收藏 ({recipes.filter((r) => r.starred).length})
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">{filter === "starred" ? "⭐" : "🍽️"}</span>
          <p className="mt-4 text-gray-500">
            {filter === "starred" ? "还没有收藏的菜谱" : "还没有保存的菜谱"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            在 AI 菜谱或周计划中点击 ☆ 收藏喜欢的菜谱
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((recipe) => {
            const isSelected = selectedIds.has(recipe.id)
            return (
              <div key={recipe.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
                recipe.starred ? "border-amber-200" : "border-gray-100"
              }`}>
                <button
                  onClick={() => isSelectMode ? toggleSelect(recipe.id) : setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                  className="w-full text-left p-4 flex items-start justify-between hover:bg-amber-50/30 transition-colors"
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {isSelectMode && (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? "bg-[#FF6B35] border-[#FF6B35]" : "border-gray-300"
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🍽️</span>
                        <h3 className="font-bold text-[#2D3436] truncate">{recipe.title}</h3>
                        {recipe.starred && <span className="text-amber-400 text-xs shrink-0">⭐</span>}
                      </div>
                      {recipe.description && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{recipe.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-400">
                        {recipe.cookingTime && <span>⏱ {recipe.cookingTime}分钟</span>}
                        {recipe.calories && <span>🔥 {recipe.calories}卡</span>}
                        {recipe.cuisineType && <span>{recipe.cuisineType}</span>}
                        {recipe.difficulty && (
                          <span className="px-1.5 py-0.5 rounded bg-gray-50">{diffLabel(recipe.difficulty)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStar(recipe.id) }}
                      className={`transition-colors text-lg ${
                        recipe.starred ? "text-amber-400" : "text-gray-300 hover:text-amber-400"
                      }`}
                      title={recipe.starred ? "取消收藏" : "收藏菜谱"}
                    >
                      {recipe.starred ? "⭐" : "☆"}
                    </button>
                    {!isSelectMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteDialog([recipe]) }}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="删除菜谱"
                      >
                        🗑️
                      </button>
                    )}
                    <span className="text-gray-300">{expandedId === recipe.id ? "▲" : "▼"}</span>
                  </div>
                </button>

              {expandedId === recipe.id && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="mt-3">
                    <p className="text-sm font-medium text-[#2D3436] mb-1">🥄 食材</p>
                    <p className="text-sm text-gray-600">{recipe.ingredients}</p>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-[#2D3436] mb-1">👨‍🍳 步骤</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      {recipe.steps.split("\n").map((step, i) => (
                        <p key={i}>{i + 1}. {step}</p>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => isDemoUser ? showToast("🔒 体验用户无法操作，请注册后使用") : setAddDialog({ recipeId: recipe.id, title: recipe.title })}
                    className="mt-4 bg-orange-50 text-[#FF6B35] px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-100 transition-colors"
                  >
                    📅 加入周计划
                  </button>
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setDeleteDialog(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg mb-2">⚠️</p>
            <p className="text-sm text-[#2D3436] font-medium mb-1">确认删除</p>
            <p className="text-sm text-gray-500">
              将删除 <span className="font-bold text-red-500">{deleteDialog.length}</span> 个菜谱
              {deleteDialog.length === 1 ? `「${deleteDialog[0].title}」` : ""}
            </p>
            <p className="text-xs text-gray-400 mt-2">此操作不可恢复</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteDialog(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">取消</button>
              <button onClick={deleteRecipes} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {addDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setAddDialog(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-[#2D3436] mb-3 text-sm">📅 加入 {addDialog.title}</p>
            <div className="flex gap-2">
              <select value={addDay} onChange={(e) => setAddDay(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
              >
                {["周一","周二","周三","周四","周五","周六","周日"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select value={addMeal} onChange={(e) => setAddMeal(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
              >
                {["早餐","午餐","晚餐"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setAddDialog(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">取消</button>
              <button
                onClick={() => {
                  const recipe = recipes.find((r) => r.id === addDialog.recipeId)
                  if (recipe) addToPlan(recipe)
                }}
                className="flex-1 bg-[#FF6B35] text-white py-2 rounded-xl text-sm"
              >
                确认加入
              </button>
            </div>
          </div>
        </div>
      )}

      {addMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D3436] text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          {addMsg}
        </div>
      )}

      {conflictData && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setConflictData(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 mx-4 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg mb-2">⚠️</p>
            <p className="text-sm text-[#2D3436] font-medium mb-1">该时段已有菜谱</p>
            <p className="text-sm text-gray-500">{addDay}{addMeal} 已有「{conflictData.existingTitle}」</p>
            <p className="text-xs text-gray-400 mt-2">要替换成「{conflictData.recipe.title}」吗？</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setConflictData(null)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">取消</button>
              <button onClick={confirmOverwrite} className="flex-1 bg-[#FF6B35] text-white py-2 rounded-xl text-sm">替换</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D3436] text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50 transition-all">
          {toast}
        </div>
      )}
    </div>
  )
}