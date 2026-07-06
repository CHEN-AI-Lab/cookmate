"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getDemoPantryItems } from "@cookmate/shared/demo-data"

const QUICK_ADD = [
  {
    category: "🥬 蔬菜",
    items: ["西红柿", "黄瓜", "青菜", "白菜", "菠菜", "生菜", "西兰花", "茄子",
      "土豆", "胡萝卜", "冬瓜", "木耳",
      "洋葱", "大蒜", "姜", "葱", "辣椒"],
  },
  {
    category: "🍎 水果",
    items: ["苹果", "香蕉", "橙子", "柠檬", "草莓"],
  },
  {
    category: "🥩 肉禽蛋",
    items: ["鸡蛋", "鸡胸肉", "鸡腿", "鸡翅", "五花肉", "猪里脊", "排骨", "牛肉", "羊肉", "培根"],
  },
  {
    category: "🥛 乳品豆制品",
    items: ["牛奶", "酸奶", "豆腐"],
  },
  {
    category: "🍚 主食粮油",
    items: ["大米", "面条", "面粉", "挂面", "馒头", "食用油", "小米", "粉丝"],
  },
]

interface PantryItem {
  id: string
  name: string
  category: string | null
}

export default function PantryPage() {
  const router = useRouter()
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [inputName, setInputName] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dupDialog, setDupDialog] = useState<string | null>(null)
  const [isDemoUser, setIsDemoUser] = useState(false)

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/pantry")
      const data = await res.json()
      if (data.items) setItems(data.items)
    } catch (err) { console.error("load items error:", err) } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  // Check demo user status and pre-fill demo data if needed
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.isDemoUser) {
          setIsDemoUser(true)
          setTimeout(() => {
            setItems((prev) => prev.length > 0 ? prev : getDemoPantryItems())
          }, 500)
        }
      })
      .catch((err) => console.error("load profile error:", err))
  }, [])

  const addItem = async (name: string, category?: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    // 检查本地列表（忽略大小写）
    if (items.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) {
      setDupDialog(trimmed)
      setTimeout(() => setDupDialog(null), 2500)
      setInputName("")
      return
    }
    try {
      const res = await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, category: category }),
      })
      if (res.ok) {
        const data = await res.json()
        setItems((prev) => [data.item, ...prev])
      } else {
        const data = await res.json().catch((err) => { console.error("parse pantry response error:", err); return {} })
        if (data.error?.includes("已存在")) {
          setDupDialog(trimmed)
          setTimeout(() => setDupDialog(null), 2500)
        } else {
          setError(data.error || "添加失败，请稍后重试")
          setTimeout(() => setError(null), 2500)
        }
      }
    } catch (err) {
      console.error("add item error:", err)
      setError("网络错误，请稍后重试")
      setTimeout(() => setError(null), 2500)
    }
    setInputName("")
  }

  const removeItem = async (id: string) => {
    try {
      await fetch(`/api/pantry/${id}`, { method: "DELETE" })
      setItems((prev) => prev.filter((i) => i.id !== id))
      // 同时从选中集合中移除已删除的食材
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (err) { console.error("remove item error:", err) }
  }

  const filtered = items.filter((i) => !search || i.name.includes(search))

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>

  return (
    <div>
      {/* 1. Title */}
      <h1 className="text-2xl font-bold text-[#2D3436] mb-4">🥦 食材库</h1>

{/* 2. Search row */}
      <div className="mb-2">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索食材..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            disabled={isDemoUser}
            className="shrink-0 bg-gradient-to-r from-orange-400 to-amber-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-sm flex items-center gap-1"
          >
            {isDemoUser ? "🔒 注册后可添加" : "＋ 添加"}
          </button>
        </div>
      </div>

      {/* 3. My ingredients */}
      <div className="mb-2">
        <h2 className="font-bold text-[#2D3436] mb-3">📦 我的食材 ({filtered.length})</h2>
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm">点击上方添加食材</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((item) => (
              <span
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`px-3 py-1 rounded-full text-sm border flex items-center gap-1 cursor-pointer transition-colors ${
                  selected.has(item.id)
                    ? "bg-gradient-to-r from-orange-400 to-amber-400 text-white border-transparent"
                    : "bg-orange-50 text-[#FF6B35] border-orange-200 hover:bg-orange-100"
                }`}
              >
                {item.name}
                <button onClick={(e) => { e.stopPropagation(); removeItem(item.id) }} className="ml-1 hover:text-red-500">{isDemoUser ? "" : "×"}</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. Action bar (always visible) */}
      {selected.size > 0 ? (
        <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-orange-400 to-amber-400 text-white px-4 py-2.5 rounded-xl">
          <button
            onClick={() => {
              const names = [...selected].map((id) => items.find((i) => i.id === id)?.name).filter(Boolean).join(",")
              router.push(`/app/recipes?ingredients=${encodeURIComponent(names)}`)
            }}
            className="text-sm font-medium hover:underline"
          >
            🍳 已选 {selected.size} 种 · 用这些食材做菜
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm opacity-80 hover:opacity-100"
          >
            ✕ 取消选择
          </button>
        </div>
      ) : (
        <div className="mb-4 flex items-center bg-gray-100 text-gray-400 px-4 py-2.5 rounded-xl">
          <span className="text-sm">👆 点击食材选择，然后在这里做菜</span>
        </div>
      )}

      {/* 5. Quick add (collapsible, default collapsed) */}
      {!isDemoUser && (
      <div className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden">
        <button
          onClick={() => setQuickAddOpen(!quickAddOpen)}
          className="w-full flex items-center justify-between px-5 py-3 text-left"
        >
          <span className="font-bold text-[#2D3436] text-sm">⚡ 快速添加食材</span>
          <span className="text-gray-400 text-sm transition-transform">{quickAddOpen ? "▲" : "▼"}</span>
        </button>
        {quickAddOpen && (
          <div className="px-5 pb-5 space-y-4">
            {QUICK_ADD.map((group) => (
              <div key={group.category}>
                <p className="text-sm text-gray-500 mb-2">{group.category}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => {
                    const alreadyAdded = items.some((i) => i.name.toLowerCase() === item.toLowerCase())
                    return (
                      <button
                        key={item}
                        onClick={async () => {
                          if (alreadyAdded) {
                            // 已添加则删除
                            const toRemove = items.find((i) => i.name === item)
                            if (toRemove) {
                              await fetch(`/api/pantry/${toRemove.id}`, { method: "DELETE" })
                              setItems((prev) => prev.filter((i) => i.id !== toRemove.id))
                              setSelected((prev) => {
                                const next = new Set(prev)
                                next.delete(toRemove.id)
                                return next
                              })
                            }
                          } else {
                            // 未添加则添加
                            addItem(item, group.category)
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          alreadyAdded
                            ? "bg-gradient-to-r from-orange-400 to-amber-400 text-white border-transparent"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#FF6B35]"
                        }`}
                      >
                        {alreadyAdded ? `✓ ${item}` : item}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Add dialog modal */}
      {showAddDialog && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => { setShowAddDialog(false); setInputName("") }}
        >
          <div
            className="bg-white rounded-2xl p-6 w-80 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#2D3436] mb-4">添加食材</h3>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={async (e) => { if (e.key === "Enter") { await addItem(inputName); setShowAddDialog(false) } }}
              placeholder="输入食材名称..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF6B35] mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAddDialog(false); setInputName("") }}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={async () => { await addItem(inputName); setShowAddDialog(false) }}
                className="flex-1 bg-gradient-to-r from-orange-400 to-amber-400 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重复添加提示 */}
      {dupDialog && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-[15vh]">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-5 py-3.5 text-sm flex items-center gap-2.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <span className="text-amber-500 text-base shrink-0">⚠️</span>
            <span className="text-gray-700">「{dupDialog}」已在食材库中</span>
          </div>
        </div>
      )}
    </div>
  )
}