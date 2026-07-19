"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { INGREDIENT_LABELS } from "@cookmate/shared/constants/ingredients"
import { getDemoPantryItems } from "@cookmate/shared/demo-data"

interface PantryItem {
  id: string
  name: string
  category: string | null
}

export default function PantryPage() {
  const router = useRouter()
  const t = useTranslations("pantry")
  const tc = useTranslations("common")
  const locale = useLocale()
  const displayName = (name: string) => locale === "zh-CN" || locale === "zh-TW" ? name : (ingLabels[name] || name)
  const catLabels = t.raw("catLabels") as Record<string, string>
  const ingLabels = INGREDIENT_LABELS
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
  const [demoToast, setDemoToast] = useState("")
  const [toast, setToast] = useState("")

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  useEffect(() => {
    fetch("/api/pantry")
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setItems(data.items)
      })
      .catch((err) => console.error("load items error:", err))
      .finally(() => setLoading(false))
  }, [])

  // Check demo user status and pre-fill demo data if needed
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.isDemoUser) {
          setIsDemoUser(true)
          setItems((prev) => prev.length > 0 ? prev : getDemoPantryItems())
        }
      })
      .catch((err) => console.error("load profile error:", err))
  }, [])

  const addItem = async (name: string, category?: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    // 统一转成中文名存储（英文→中文映射）
    const trimmedLower = trimmed.toLowerCase()
    const enToZh: Record<string, string> = {}
    for (const [zh, en] of Object.entries(ingLabels)) {
      enToZh[en.toLowerCase()] = zh.toLowerCase()
    }
    const chineseName = enToZh[trimmedLower] || trimmed

    // 重复检测：用中文名比较
    if (items.some((i) => i.name.toLowerCase() === chineseName.toLowerCase())) {
      setDupDialog(chineseName)
      setTimeout(() => setDupDialog(null), 2500)
      setInputName("")
      return
    }
    try {
      const res = await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: chineseName, category: category }),
      })
      if (res.ok) {
        const data = await res.json()
        setItems((prev) => [data.item, ...prev])
        setToast(`${locale.startsWith("zh") ? "已添加 " : "Added "}${displayName(data.item.name)}`)
        setTimeout(() => setToast(""), 2000)
      } else {
        const data = await res.json().catch((err) => { console.error("parse pantry response error:", err); return {} })
        if (data.error?.includes("已存在")) {
          setDupDialog(chineseName)
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

  if (loading) return <div className="text-center py-16 text-gray-400">{t("loading")}</div>

  return (
    <div>
      {/* 1. Title */}
      <h1 className="text-2xl font-bold text-[#2D3436] mb-4">{t("title")}</h1>

{/* 2. Search row */}
      <div className="mb-2">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            disabled={isDemoUser}
            className="shrink-0 bg-gradient-to-r from-orange-400 to-amber-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-sm flex items-center gap-1"
          >
            {isDemoUser ? t("demoLockedAdd") : t("addButton")}
          </button>
        </div>
      </div>

      {/* 3. My ingredients */}
      <div className="mb-2">
        <h2 className="font-bold text-[#2D3436] mb-3">{t("myItems", { count: filtered.length })}</h2>
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm">{t("empty")}</p>
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
                {displayName(item.name)}
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
              if (isDemoUser) {
                setDemoToast(t("demoLockedAction"))
                setTimeout(() => setDemoToast(""), 3000)
                return
              }
              const names = [...selected].map((id) => items.find((i) => i.id === id)?.name).filter(Boolean).join(",")
              router.push(`/app/recipes?ingredients=${encodeURIComponent(names)}`)
            }}
            className="text-sm font-medium hover:underline"
          >
            {t("selectedCount", { count: selected.size })}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm opacity-80 hover:opacity-100"
          >
            {t("cancelSelection")}
          </button>
        </div>
      ) : (
        <div className="mb-4 flex items-center bg-gray-100 text-gray-400 px-4 py-2.5 rounded-xl">
          <span className="text-sm">{t("clickToSelect")}</span>
        </div>
      )}

      {/* 5. Quick add (collapsible, default collapsed) */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden">
        <button
          onClick={() => setQuickAddOpen(!quickAddOpen)}
          className="w-full flex items-center justify-between px-5 py-3 text-left"
        >
          <span className="font-bold text-[#2D3436] text-sm">{t("quickAdd")}</span>
          <span className="text-gray-400 text-sm transition-transform">{quickAddOpen ? "▲" : "▼"}</span>
        </button>
        {quickAddOpen && (
          <div className="px-5 pb-5 space-y-4">
            {(t.raw("quickAddItems") as Array<{category: string; items: string[]}>).map((group) => (
              <div key={group.category}>
                <p className="text-sm text-gray-500 mb-2">{catLabels[group.category] || group.category}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => {
                    const alreadyAdded = items.some((i) => i.name.toLowerCase() === item.toLowerCase())
                    return (
                      <button
                        key={item}
                        onClick={async () => {
                          if (isDemoUser) {
                            setDemoToast(t("demoLockedAction"))
                            setTimeout(() => setDemoToast(""), 3000)
                            return
                          }
                          if (alreadyAdded) {
                            // 已添加则删除
                            const toRemove = items.find((i) => i.name.toLowerCase() === item.toLowerCase())
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
                            // 未添加则添加（始终存中文名）
                            addItem(item, group.category)
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          alreadyAdded
                            ? "bg-gradient-to-r from-orange-400 to-amber-400 text-white border-transparent"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#FF6B35]"
                        } ${isDemoUser ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {alreadyAdded ? `✓ ${displayName(item)}` : displayName(item)}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
            <h3 className="text-lg font-bold text-[#2D3436] mb-4">{t("addDialogTitle")}</h3>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={async (e) => { if (e.key === "Enter") { await addItem(inputName); setShowAddDialog(false) } }}
              placeholder={t("addItemPlaceholder")}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF6B35] mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAddDialog(false); setInputName("") }}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-200"
              >
                {t("cancel")}
              </button>
              <button
                onClick={async () => { await addItem(inputName); setShowAddDialog(false) }}
                className="flex-1 bg-gradient-to-r from-orange-400 to-amber-400 text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90"
              >
                              {t("add")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 重复添加提示 */}
                    {dupDialog && (
                      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setDupDialog(null)}>
                        <div className="bg-[#2D3436] text-white px-6 py-4 rounded-xl shadow-xl text-sm max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
                          <span>{t("alreadyInPantry", { name: dupDialog })}</span>
                        </div>
                      </div>
                    )}

      {/* Demo user toast */}
      {demoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D3436] text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          {demoToast}
        </div>
      )}
      {/* Success toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50 flex items-center gap-2">
          <span>✅</span> {toast}
        </div>
      )}
    </div>
  )
}