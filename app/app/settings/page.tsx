"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DIET_OPTIONS, CUISINE_OPTIONS, SERVING_SIZE_OPTIONS } from "@/lib/preferences"

export default function SettingsPage() {
  const [settings, setSettings] = useState({ dietType: "不限", cuisinePref: [] as string[], servingSize: 2, subscriptionTier: "FREE" })
  const [profile, setProfile] = useState<{ name: string; phone: string; email: string; loginMethod: string; createdAt: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/user/profile").then((r) => r.json()),
    ])
      .then(([settingsData, profileData]) => {
        if (settingsData.settings) {
          setSettings({
            dietType: settingsData.settings.dietType ?? "不限",
            cuisinePref: settingsData.settings.cuisinePref ? settingsData.settings.cuisinePref.split(",").filter(Boolean) : [],
            servingSize: settingsData.settings.servingSize ?? 2,
            subscriptionTier: settingsData.settings.subscriptionTier ?? "FREE",
          })
        }
        if (profileData.name !== undefined) {
          setProfile(profileData)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

const save = async () => {
    // 至少选择一个菜系
    if (settings.cuisinePref.length === 0) {
      setError("请至少选择一个菜系")
      return
    }
    setError("")
    setSaving(true)
    setSaved(false)
    try {
      const payload = { ...settings, cuisinePref: settings.cuisinePref.join(",") }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSaved(true)
        setShowSaved(true)
        // 2.5秒后开始淡出
        setTimeout(() => {
          setShowSaved(false)
          // 淡出动画300ms后真正隐藏
          setTimeout(() => setSaved(false), 300)
        }, 2500)
      }
    } catch {} finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#2D3436] mb-6">⚙️ 设置</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* 左栏：账号信息 + 套餐 */}
        <div className="h-full">
          <div className="bg-white rounded-2xl shadow-sm border border-orange-50 p-6 h-full">
            <h2 className="font-bold text-[#2D3436] mb-4">👤 账号信息</h2>
            {profile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">用户名</span>
                  <span className="text-sm font-medium text-[#2D3436]">{profile.name || "未设置"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">登录方式</span>
                  <span className="text-sm font-medium text-[#2D3436]">{profile.loginMethod}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">手机号</span>
                  <span className="text-sm font-medium text-[#2D3436]">{profile.phone ? profile.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "未绑定"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">邮箱</span>
                  <span className="text-sm font-medium text-[#2D3436]">{profile.email || "未绑定"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">注册时间</span>
                  <span className="text-sm font-medium text-[#2D3436]">{new Date(profile.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">当前计划</span>
                  <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                    settings.subscriptionTier === "PRO" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {settings.subscriptionTier === "PRO" ? "专业版" : "免费版"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">加载中...</p>
            )}
            <Link href="/app/billing" className="inline-block mt-4 bg-gradient-to-r from-[#FF6B35] to-orange-400 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90">
              {settings.subscriptionTier === "PRO" ? "💳 管理订阅" : "⬆️ 升级专业版"}
            </Link>
          </div>
        </div>

        {/* 右栏：饮食偏好 */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-50 p-6 h-full">
          <h2 className="font-bold text-[#2D3436] mb-4">🥗 饮食偏好</h2>
          <div className="space-y-5">
            <div>
              <label className="text-sm text-gray-600 font-medium">饮食类型</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIET_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSettings({ ...settings, dietType: opt })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      settings.dietType === opt
                        ? "bg-[#FF6B35] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium">菜系偏好（可多选）</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CUISINE_OPTIONS.map((opt) => {
                  const selected = settings.cuisinePref.includes(opt)
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        setSettings({
                          ...settings,
                          cuisinePref: selected
                            ? settings.cuisinePref.filter((c) => c !== opt)
                            : [...settings.cuisinePref, opt]
                        })
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                        selected
                          ? "bg-[#FF6B35] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {selected ? "✓" : ""} {opt}
                    </button>
                  )
                })}
              </div>
              {settings.cuisinePref.length >= 1 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  已选 {settings.cuisinePref.length} 种菜系
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-600">份量（人数）</label>
              <div className="flex items-center gap-2 mt-1.5">
                {SERVING_SIZE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setSettings({ ...settings, servingSize: n })}
                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                      settings.servingSize === n
                        ? "bg-[#FF6B35] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={save}
              disabled={saving || settings.cuisinePref.length === 0}
              className="bg-[#FF6B35] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
            >
              {saving ? "保存中..." : "保存设置"}
            </button>
            {saved && (
              <span className={`text-sm text-green-600 transition-opacity duration-300 ${showSaved ? 'opacity-100' : 'opacity-0'}`}>
                ✅ 已保存
              </span>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  )
}