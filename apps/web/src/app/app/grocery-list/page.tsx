"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { getDemoGroceryList } from "@cookmate/shared/demo-data"

interface IngredientItem {
  name: string
  quantity: string
  inPantry: boolean
  sources: { title: string; quantity: string }[]
}

interface CategoryGroup {
  name: string
  items: IngredientItem[]
}

export default function GroceryListPage() {
  const [categories, setCategories] = useState<CategoryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [inPantryCount, setInPantryCount] = useState(0)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [manualItems, setManualItems] = useState<string[]>([])

  // useRef 同步跟踪已同步到食材库的物品，防止 React StrictMode 双重调用导致重复创建
  const syncedRef = useRef<Set<string>>(new Set())
  // 记录每个物品是"新增"还是"原来就有的"：true=本次新增, false=原来就有
  const newlyAddedRef = useRef<Map<string, boolean>>(new Map())

  const [stapleItems, setStapleItems] = useState<string[]>([])
  const [stapleOpen, setStapleOpen] = useState(false)
  const [newItem, setNewItem] = useState("")
  const [days, setDays] = useState(7)

  // 重复添加弹窗
  const [dupDialog, setDupDialog] = useState<string | null>(null)

  // 来源弹窗
  const [sourceDialog, setSourceDialog] = useState<{ name: string; sources: { title: string; quantity: string }[] } | null>(null)

  // 同步状态通知
  const [purchaseNotify, setPurchaseNotify] = useState<{ name: string; success: boolean; existing: boolean } | null>(null)

  // Demo user state
  const [isDemoUser, setIsDemoUser] = useState(false)
  const demoRef = useRef(false)
  // Demo toast notification
  const [demoToast, setDemoToast] = useState("")

  // 从 localStorage 加载勾选状态
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cookmate_grocery_checked")
      if (saved) setChecked(new Set(JSON.parse(saved)))
      // 注意：manualItems 不再从 localStorage 读取，改为从 API 获取（按用户隔离）
      // 历史残留的 localStorage 数据会被 API 的正确数据覆盖
      const synced = localStorage.getItem("cookmate_grocery_synced")
      if (synced) syncedRef.current = new Set(JSON.parse(synced))
      const added = localStorage.getItem("cookmate_grocery_newly_added")
      if (added) newlyAddedRef.current = new Map(Object.entries(JSON.parse(added)))
    } catch (err) { console.error("load grocery checkout state error:", err) }
  }, [])

  // 同步单个物品到食材库
  const syncToPantry = async (name: string) => {
    // useRef 同步检查，不受 React 异步渲染影响
    if (syncedRef.current.has(name)) return
    syncedRef.current.add(name)
    try {
      const res = await fetch("/api/grocery-list/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (data.success) {
        // 记录是否是新增（不是原来就有的）
        newlyAddedRef.current.set(name, !data.alreadyExists)
        localStorage.setItem("cookmate_grocery_newly_added", JSON.stringify(Object.fromEntries(newlyAddedRef.current)))
        localStorage.setItem("cookmate_grocery_synced", JSON.stringify([...syncedRef.current]))
        setPurchaseNotify({ name, success: true, existing: !!data.alreadyExists })
        setTimeout(() => setPurchaseNotify(null), 2500)
      }
    } catch (err) {
      console.error("sync to pantry error:", err)
      // 失败则恢复标记，允许重试
      syncedRef.current.delete(name)
      newlyAddedRef.current.delete(name)
    }
  }

  // 从食材库移除（取消勾选时调用）
  const removeFromPantry = async (name: string) => {
    // 只有本次新增的才移除（原本就在食材库的不动）
    if (!newlyAddedRef.current.get(name)) return
    try {
      await fetch("/api/grocery-list/purchase", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
    } catch (err) {
      console.error("remove from pantry error:", err)
      // 静默
    }
    // 清理标记
    syncedRef.current.delete(name)
    newlyAddedRef.current.delete(name)
    localStorage.setItem("cookmate_grocery_synced", JSON.stringify([...syncedRef.current]))
    localStorage.setItem("cookmate_grocery_newly_added", JSON.stringify(Object.fromEntries(newlyAddedRef.current)))
  }

  const toggleCheck = (name: string) => {
    if (isDemoUser) {
      setDemoToast("🔒 体验用户无法操作，请注册后使用")
      setTimeout(() => setDemoToast(""), 3000)
      return
    }
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
        // 取消勾选时，移除之前同步到食材库的条目（仅限本次新增的）
        removeFromPantry(name)
      } else {
        next.add(name)
        // 勾选时自动添加到食材库
        syncToPantry(name)
      }
      localStorage.setItem("cookmate_grocery_checked", JSON.stringify([...next]))
      return next
    })
  }

  const addManualItem = () => {
    const trimmed = newItem.trim()
    if (!trimmed) return
    // 检查是否已在手动列表或分类列表中（忽略大小写）
    const allItems = [
      ...manualItems,
      ...categories.flatMap((cat) => cat.items.map((i) => i.name))
    ]
    if (allItems.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setDupDialog(trimmed)
      setTimeout(() => setDupDialog(null), 2500)
      setNewItem("")
      return
    }
    // 先调 API 存到数据库（按用户隔离），成功才更新本地状态
    fetch("/api/grocery-list/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
    .then((r) => {
      if (r.ok) {
        // API 成功 → 更新本地状态
        setManualItems((prev) => [...prev, trimmed])
      } else {
        r.json().then((data) => {
          if (data.error?.includes("已存在")) {
            setDupDialog(trimmed)
            setTimeout(() => setDupDialog(null), 2500)
          } else if (data.error) {
            // 显示其他拒绝原因（如常备品限制、网络错误等）
            setDupDialog(`${trimmed} (${data.error})`)
            setTimeout(() => setDupDialog(null), 3000)
          }
        }).catch((err) => console.error("parse grocery response error:", err))
      }
    })
    .catch((err) => {
      console.error("add manual item error:", err)
      // 网络失败时用一个简单提示（不阻塞用户）
    })
    setNewItem("")
  }

  const removeManualItem = (name: string) => {
    fetch("/api/grocery-list/manual", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    .then((r) => {
      if (r.ok) {
        setManualItems((prev) => prev.filter((i) => i !== name))
      }
    })
    .catch((err) => console.error("remove manual item error:", err))
  }

  const loadData = useCallback(() => {
    if (demoRef.current) return
    fetch(`/api/grocery-list?days=${days}`)
      .then((r) => r.json())
      .then((data) => {
        if (demoRef.current) return
        if (data.categories) {
          const categories = data.categories as Record<string, IngredientItem[]>
          setCategories(
            Object.entries(categories)
              .filter(([, items]) => items.length > 0)
              .map(([name, items]) => ({ name, items }))
          )
          setTotal(data.total || 0)
          setInPantryCount(data.inPantryCount || 0)
          setStapleItems(data.stapleItems || [])
          if (data.manualItems) setManualItems(data.manualItems)

// 同步勾选状态：从食材库删除了的，自动取消勾选
          setChecked((prev) => {
            const next = new Set(prev)
            const allItems = Object.values(categories).flat()
            const checkedButGone = new Set<string>()
            
            // 清理 checked 中已不在食材库的
            for (const name of next) {
              if (manualItems.includes(name)) continue
              const inData = allItems.find((i) => i.name === name)
              if (!inData || !inData.inPantry) checkedButGone.add(name)
            }
            
            // 清理 syncedRef 中已不在食材库的（即使没勾选，防止残留阻塞重新勾选）
            for (const name of syncedRef.current) {
              const inData = allItems.find((i) => i.name === name)
              if (!inData || !inData.inPantry) {
                next.delete(name)
                checkedButGone.add(name)
                syncedRef.current.delete(name)
                newlyAddedRef.current.delete(name)
              }
            }
            
            // 清理被标记删除的
            for (const name of checkedButGone) {
              next.delete(name)
            }
            
            localStorage.setItem("cookmate_grocery_checked", JSON.stringify([...next]))
            localStorage.setItem("cookmate_grocery_synced", JSON.stringify([...syncedRef.current]))
            localStorage.setItem("cookmate_grocery_newly_added", JSON.stringify(Object.fromEntries(newlyAddedRef.current)))
            return next
          })
        }
      })
      .catch((err) => console.error("load grocery list error:", err))
      .finally(() => setLoading(false))
  }, [days])

  useEffect(() => { loadData() }, [days])

  // Check demo user status and pre-fill demo data if needed
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.isDemoUser) {
          setIsDemoUser(true)
          // If no real data loaded yet, set demo data
          setCategories((prev) => prev.length > 0 ? prev : getDemoGroceryList().categories)
          setTotal((prev) => prev > 0 ? prev : getDemoGroceryList().total)
          setInPantryCount((prev) => prev > 0 ? prev : getDemoGroceryList().inPantryCount)
          setStapleItems((prev) => prev.length > 0 ? prev : getDemoGroceryList().stapleItems)
          setManualItems((prev) => prev.length > 0 ? prev : [])
          demoRef.current = true
        }
      })
      .catch((err) => console.error("load profile error:", err))
  }, [])

  // 页面获得焦点时刷新数据（从食材库删除食材后切回来更新已有状态）
  useEffect(() => {
    const onFocus = () => { if (!demoRef.current) loadData() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadData])

  const openSourceDialog = (item: IngredientItem) => {
    if (item.sources && item.sources.length > 0) {
      setSourceDialog({ name: item.name, sources: item.sources })
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#2D3436] mb-6">🛒 购物清单</h1>

      {categories.length === 0 && manualItems.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">📋</span>
          <p className="mt-4 text-gray-500">还没有购物清单</p>
          <p className="text-sm text-gray-400 mt-1">
            先到 <Link href="/app/meal-plan" className="text-[#FF6B35] hover:underline">周计划</Link> 规划菜单，清单自动生成
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400">共 {total + manualItems.length} 种食材</span>
              {inPantryCount > 0 && (
                <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                  食材库已有 {inPantryCount} 种 ✅
                </span>
              )}
            </div>
            {/* 天数选择器 */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 text-xs">
              {[3, 5, 7].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    if (isDemoUser) {
                      setDemoToast("🔒 体验用户无法切换天数，请注册后使用")
                      setTimeout(() => setDemoToast(""), 3000)
                      return
                    }
                    setDays(n)
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    days === n ? "bg-white text-[#FF6B35] font-medium shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  前{n}天
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-0">
            {categories.map((cat) => (
              <div key={cat.name} className="border-b border-gray-100 py-2 last:border-b-0">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{cat.name}</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  {cat.items.map((item, i) => (
                    <label key={i} className="text-sm flex items-center gap-1.5 cursor-pointer hover:text-[#FF6B35] transition-colors group">
                      <input type="checkbox" checked={checked.has(item.name)} onChange={() => toggleCheck(item.name)} className="rounded accent-[#FF6B35] w-3.5 h-3.5 shrink-0" />
                      <span
                        className={`${
                          item.inPantry ? "text-green-600" : checked.has(item.name) ? "text-gray-300 line-through" : "text-gray-600"
                        } cursor-pointer ${
                          item.sources && item.sources.length > 0 ? "border-b border-dashed border-gray-300 hover:border-[#FF6B35]" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault()
                          openSourceDialog(item)
                        }}
                      >
                        {item.name}
                        {item.quantity && <span className="text-gray-400 font-normal"> ({item.quantity})</span>}
                      </span>
                      {item.inPantry && (
                        <span className="text-[10px] text-green-500 bg-green-50 px-1 rounded shrink-0">已有</span>
                      )}
                      {item.sources && item.sources.length > 0 && (
                        <span className="text-[10px] text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">🔍</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {/* 手动添加的食材 */}
            {manualItems.length > 0 && (
              <div className="border-b border-gray-100 py-2 last:border-b-0">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">📝 手动添加</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  {manualItems.map((name, i) => (
                    <label key={i} className="text-sm flex items-center gap-1.5 cursor-pointer hover:text-[#FF6B35] transition-colors">
                      <input type="checkbox" checked={checked.has(name)} onChange={() => toggleCheck(name)} className="rounded accent-[#FF6B35] w-3.5 h-3.5" />
                      <span className={`${checked.has(name) ? "text-gray-300 line-through" : "text-gray-600"}`}>
                        {name}
                      </span>
                      <button onClick={() => removeManualItem(name)} className="text-gray-300 hover:text-red-500 text-xs ml-auto">✕</button>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 常备品（已过滤的调料） */}
          {stapleItems.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setStapleOpen(!stapleOpen)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className={`transition-transform ${stapleOpen ? "rotate-90" : ""}`}>▶</span>
                常备品（{stapleItems.length}种）
              </button>
              {stapleOpen && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                  {stapleItems.map((name) => (
                    <span key={name} className="px-1.5 py-0.5 bg-gray-50 rounded">{name}</span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-gray-300 mt-1">这些是家中常备的调味料，未计入购物清单，用完记得补货</p>
            </div>
          )}

        </>
      )}

      {/* 手动添加输入框 */}
      {!isDemoUser && (
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManualItem() } }}
            placeholder="手动添加物品..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35]"
          />
          <button
            onClick={addManualItem}
            className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shrink-0"
          >
            添加
          </button>
        </div>
      </div>
      )}

      {/* 添加到食材库通知 */}
      {purchaseNotify && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
          <div className="bg-green-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
            {purchaseNotify.existing ? (
              <>🍳 "{purchaseNotify.name}" 已在食材库中</>
            ) : (
              <>📦 "{purchaseNotify.name}" 已添加到食材库</>
            )}
          </div>
        </div>
      )}

      {/* 来源弹窗 */}
      {sourceDialog && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setSourceDialog(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#2D3436]">
                🥘 "{sourceDialog.name}" 的来源
              </h3>
              <button
                onClick={() => setSourceDialog(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {sourceDialog.sources.map((src, i) => (
                <div key={i} className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3">
                  <span className="text-sm font-medium text-[#2D3436]">{src.title}</span>
                  <span className="text-sm text-gray-500">{src.quantity}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSourceDialog(null)}
              className="w-full mt-4 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 重复添加提示 */}
      {dupDialog && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-[15vh]">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-5 py-3.5 text-sm flex items-center gap-2.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <span className="text-amber-500 text-base shrink-0">⚠️</span>
            <span className="text-gray-700">「{dupDialog}」已在购物清单中</span>
          </div>
        </div>
      )}

      {/* Demo user toast */}
      {demoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D3436] text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          {demoToast}
        </div>
      )}
    </div>
  )
}