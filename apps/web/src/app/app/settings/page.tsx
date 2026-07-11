"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import PasswordInput from "@/components/ui/PasswordInput"
import { DIET_OPTIONS, CUISINE_OPTIONS, SERVING_SIZE_OPTIONS } from "@cookmate/shared/constants"

export default function SettingsPage() {
  const ts = useTranslations("settings")
  const tc = useTranslations("common")
  const tv = useTranslations("validation")
  const locale = useLocale()

  const dietLabel: Record<string, string> = {
    "不限": ts("dietUnlimited"), "减脂": ts("dietLoseFat"),
    "增肌": ts("dietBuildMuscle"), "素食": ts("dietVegetarian"),
    "低碳水": ts("dietLowCarb"), "无麸质": ts("dietGlutenFree"),
  }
  const cuisineLabel: Record<string, string> = {
    "中餐": ts("cuisineChinese"), "西餐": ts("cuisineWestern"),
    "日料": ts("cuisineJapanese"), "韩餐": ts("cuisineKorean"),
    "东南亚": ts("cuisineSoutheastAsian"), "印度菜": ts("cuisineIndian"),
    "中东菜": ts("cuisineMiddleEastern"), "墨西哥菜": ts("cuisineMexican"),
  }
  const [settings, setSettings] = useState<{ dietType: string; cuisinePref: string[]; servingSize: number; subscriptionTier: string }>({ dietType: DIET_OPTIONS[0], cuisinePref: [] as string[], servingSize: 2, subscriptionTier: "FREE" })
  const [profile, setProfile] = useState<{ name: string; phone: string; email: string; loginMethod: string; createdAt: string; hasPassword?: boolean; isDemoUser?: boolean } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState("")
  const [showBindPhone, setShowBindPhone] = useState(false)
  const [bindPhone, setBindPhone] = useState("")
  const [bindCode, setBindCode] = useState("")
  const [showBindEmail, setShowBindEmail] = useState(false)
  const [bindEmail, setBindEmail] = useState("")
  const [bindEmailCode, setBindEmailCode] = useState("")
  const [bindCodeSent, setBindCodeSent] = useState(false)
  const [bindLoading, setBindLoading] = useState(false)
  const [bindCountdown, setBindCountdown] = useState(0)
  const [bindError, setBindError] = useState("")
    const [accountMsg, setAccountMsg] = useState("")
    const [globalToast, setGlobalToast] = useState("")
  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/user/profile").then((r) => r.json()),
    ])
      .then(([settingsData, profileData]) => {
        if (settingsData.settings) {
          setSettings({
            dietType: settingsData.settings.dietType ?? DIET_OPTIONS[0],
            cuisinePref: settingsData.settings.cuisinePref ? settingsData.settings.cuisinePref.split(",").filter(Boolean) : [],
            servingSize: settingsData.settings.servingSize ?? 2,
            subscriptionTier: settingsData.settings.subscriptionTier ?? "FREE",
          })
        }
        if (profileData.name !== undefined) {
          setProfile({ ...profileData, hasPassword: profileData.hasPassword, isDemoUser: !!profileData.isDemoUser })
        }
      })
      .catch((err) => console.error("load settings error:", err))
      .finally(() => setLoading(false))
  }, [])

  const saveName = async () => {
    if (!editNameValue.trim() || editNameValue.trim() === profile?.name) {
      setEditingName(false)
      return
    }
    try {
      const r = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editNameValue.trim() }),
      })
      if (r.ok) {
        setProfile((p) => p ? { ...p, name: editNameValue.trim() } : p)
        setEditingName(false)
        setAccountMsg(ts("nameUpdated"))
        setTimeout(() => setAccountMsg(""), 3000)
      } else {
        const d = await r.json()
        setAccountMsg(d.error || ts("updateFailed"))
        setTimeout(() => setAccountMsg(""), 3000)
      }
    } catch (err) {
      console.error("save name error:", err)
      setAccountMsg(tv("networkError"))
      setTimeout(() => setAccountMsg(""), 3000)
    }
  }

  const sendBindEmailCode = async () => {
    if (!bindEmail || !/^[^\s]+@[^\s]+\.[^\s]+$/.test(bindEmail)) { setAccountMsg(tv("invalidEmail")); setTimeout(() => setAccountMsg(""), 3000); return }
    setBindLoading(true)
    try {
      const r = await fetch("/api/user/bind-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: bindEmail, locale }) })
      const d = await r.json()
      if (r.ok) { setBindCodeSent(true); setAccountMsg(ts("codeSentToEmail", { email: bindEmail })); setTimeout(() => setAccountMsg(""), 3000) }
      else { setAccountMsg(d.error || tv("sendFailed")); setTimeout(() => setAccountMsg(""), 3000) }
    } catch (err) { console.error("send bind email code error:", err); setAccountMsg(tv("networkError")); setTimeout(() => setAccountMsg(""), 3000) }
    finally { setBindLoading(false) }
  }

  const confirmBindEmail = async () => {
    if (!bindEmailCode || bindEmailCode.length < 6) { setAccountMsg(tv("emptyCode")); setTimeout(() => setAccountMsg(""), 3000); return }
    setBindLoading(true)
    try {
      const r = await fetch("/api/user/bind-email", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: bindEmail, code: bindEmailCode, locale }) })
      const d = await r.json()
      if (r.ok) { setProfile((p) => p ? { ...p, email: bindEmail } : p); setShowBindEmail(false); setBindCodeSent(false); setBindEmail(""); setBindEmailCode(""); setAccountMsg(ts("bindSuccessEmail")); setTimeout(() => setAccountMsg(""), 3000) }
      else { setAccountMsg(d.error || ts("bindFailed")); setTimeout(() => setAccountMsg(""), 3000) }
    } catch (err) { console.error("confirm bind email error:", err); setAccountMsg(tv("networkError")); setTimeout(() => setAccountMsg(""), 3000) }
    finally { setBindLoading(false) }
  }

const save = async () => {
    if (settings.cuisinePref.length === 0) {
      setError(ts("selectCuisineFirst"))
      setTimeout(() => setError(""), 3000)
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
        setTimeout(() => {
          setShowSaved(false)
          setTimeout(() => setSaved(false), 300)
        }, 2500)
      }
    } catch (err) { console.error("save settings error:", err) } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">{tc("loading")}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#2D3436] mb-6">⚙️ {ts("title")}</h1>

      {profile?.isDemoUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-center">
          <p className="font-semibold text-amber-800 mb-1">{tc("demoMode")}</p>
          <p className="text-sm text-amber-700 mb-3">
            {ts("demoDesc")}<br />
            {ts("demoRegisterHint")}
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#FF6B35] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-all"
          >
            {tc("freeRegister")}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left column: Account info + Plan */}
        <div className="h-full">
          <div className="bg-white rounded-2xl shadow-sm border border-orange-50 p-6 h-full">
            <h2 className="font-bold text-[#2D3436] mb-4">{ts("profile")}</h2>
            {profile ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                              <span className="text-sm text-gray-500">{ts("username")}</span>
                              <span className="text-sm font-medium text-[#2D3436]">
                                {editingName ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editNameValue}
                                      onChange={(e) => setEditNameValue(e.target.value)}
                                      maxLength={30}
                                      className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#FF6B35] w-32"
                                      autoFocus
                                      onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false) }}
                                    />
                                    <button onClick={saveName} className="text-xs text-[#FF6B35] hover:underline">{ts("saveName")}</button>
                                    <button onClick={() => setEditingName(false)} className="text-xs text-gray-400 hover:text-gray-600">{ts("cancelName")}</button>
                                  </div>
                                ) : (
                                  <>
                                    {profile.name || ts("notSet")}
                                    <button onClick={() => { if (profile?.isDemoUser) { setGlobalToast(ts("demoToast")); setTimeout(() => setGlobalToast(""), 3000); return } setEditNameValue(profile.name || ""); setEditingName(true) }} className="ml-2 text-[#FF6B35] text-xs hover:underline disabled:text-gray-300 disabled:cursor-not-allowed">{ts("editName")}</button>
                                  </>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                              <span className="text-sm text-gray-500">{ts("loginMethod")}</span>
                  <span className="text-sm font-medium text-[#2D3436]">{profile.loginMethod}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{ts("phone")}</span>
                  <span className="text-sm font-medium text-[#2D3436]">
                    {profile.phone ? profile.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : ts("notBound")}
                    {!profile.phone && (
                      <button
                        onClick={() => {
                          if (profile?.isDemoUser) {
                            setGlobalToast(ts("demoToast"))
                            setTimeout(() => setGlobalToast(""), 3000)
                            return
                          }
                          setShowBindPhone(!showBindPhone)
                        }}
                        className="ml-2 text-[#FF6B35] text-xs hover:underline"
                      >
                        {ts("bindAction")}
                      </button>
                    )}
                  </span>
                </div>
                {showBindPhone && (
                                <div className="py-3 border-b border-gray-50 space-y-3">
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                      <p className="text-xs text-amber-700 font-medium">{ts("bindWarningTitle")}</p>
                                      <p className="text-xs text-amber-600 mt-1">{ts("bindWarning")}</p>
                                    </div>
                                    <input
                                      type="tel" maxLength={11} placeholder={ts("bindPhonePlaceholder")}
                                      value={bindPhone}
                                      onChange={(e) => setBindPhone(e.target.value.replace(/\D/g, ""))}
                                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35]"
                                    />
                                    <PasswordInput
                                                          placeholder={ts("bindPasswordPlaceholder")}
                                                          value={bindCode}
                                                          onChange={setBindCode}
                                                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35]"
                                                        />
                                    <div className="flex gap-2">
                                      <button
                                      onClick={async () => {
                                        if (!/^1[3-9]\d{9}$/.test(bindPhone)) { setBindError(ts("bindErrorInvalidPhone")); return }
                                        if (bindPhone === '11111111111' || bindPhone === '00000000000' || bindPhone === '12345678901' || /^1(\d)\1{9}$/.test(bindPhone)) { setBindError(ts("bindErrorRealPhone")); return }
                                        if (!bindCode || bindCode.length < 8) { setBindError(ts("bindErrorPasswordTooShort")); return }
                                        let pwdTypes = 0;
                                        if (/[a-z]/.test(bindCode)) pwdTypes++;
                                        if (/[A-Z]/.test(bindCode)) pwdTypes++;
                                        if (/[0-9]/.test(bindCode)) pwdTypes++;
                                        if (/[^a-zA-Z0-9]/.test(bindCode)) pwdTypes++;
                                        if (pwdTypes < 2) { setBindError(ts("bindErrorPasswordTypes")); return }
                                        setBindLoading(true)
                                        setBindError("")
                                        try {
                                          const r = await fetch("/api/user/profile", {
                                            method: "PUT", headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ phone: bindPhone, password: bindCode, locale }),
                                          })
                                          const d = await r.json()
                                          if (r.ok) {
                                            setProfile((p) => p ? { ...p, phone: bindPhone } : p)
                                            setShowBindPhone(false)
                                            setAccountMsg(ts("bindSuccessPhone"))
                                            setTimeout(() => setAccountMsg(""), 3000)
                                          } else {
                                            setBindError(d.error || ts("bindFailed"))
                                          }
                                        } catch (err) { console.error("bind phone error:", err); setBindError(tv("networkError")) }
                                        finally { setBindLoading(false) }
                                      }}
                                      disabled={bindLoading || !bindPhone || !bindCode}
                                      className="flex-1 bg-[#FF6B35] text-white rounded-xl py-2 text-sm font-medium hover:bg-orange-600 disabled:bg-gray-300"
                                    >
                                      {bindLoading ? ts("bindLoading") : ts("bindConfirm")}
                                    </button>
                                    <button onClick={() => { setShowBindPhone(false); setBindPhone(""); setBindCode(""); setBindError("") }} className="text-sm text-gray-400 hover:text-gray-600 px-3">{ts("bindCancel")}</button>
                                    </div>
                                    {bindError && <p className="text-xs text-red-500">{bindError}</p>}
                                  </div>
                                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                  <span className="text-sm text-gray-500">{ts("email")}</span>
                                  <span className="text-sm font-medium text-[#2D3436]">
                                    {profile.email || ts("notBound")}
                                    {!profile.email && !showBindEmail && (
                                      <button onClick={() => { if (profile?.isDemoUser) { setGlobalToast(ts("demoToast")); setTimeout(() => setGlobalToast(""), 3000); return } setShowBindEmail(true) }} className="ml-2 text-[#FF6B35] text-xs hover:underline">{ts("bindAction")}</button>
                                                                        )}
                                  </span>
                                </div>
                                {showBindEmail && (
                                                  <div className="py-3 border-b border-gray-50 space-y-3">
                                                    <div className="flex gap-2">
                                                      <input type="email" placeholder={ts("bindEmailPlaceholder")} value={bindEmail} onChange={(e) => setBindEmail(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35]" />
                                                      <button onClick={sendBindEmailCode} disabled={bindCodeSent || !bindEmail || !/^[^\s]+@[^\s]+\.[^\s]+$/.test(bindEmail)}
                                                        className="px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 whitespace-nowrap"
                                                      >{bindCodeSent ? ts("codeSent") : ts("getCode")}</button>
                                                      <button onClick={() => { setShowBindEmail(false); setBindCodeSent(false); setBindEmail(""); setBindEmailCode("") }} className="text-sm text-gray-400 hover:text-gray-600 px-2">{ts("bindCancel")}</button>
                                                    </div>
                                                    {bindCodeSent && (
                                                      <>
                                                        <input type="text" maxLength={6} placeholder={ts("bindCodePlaceholder")} value={bindEmailCode} onChange={(e) => setBindEmailCode(e.target.value.replace(/\D/g, ""))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35]" />
                                                        <button onClick={confirmBindEmail}
                                                          disabled={bindLoading || !bindEmailCode || bindEmailCode.length < 6}
                                                          className="w-full bg-[#FF6B35] text-white rounded-xl py-2 text-sm font-medium hover:bg-orange-600 disabled:bg-gray-300"
                                                        >{bindLoading ? ts("bindLoading") : ts("bindConfirm")}</button>
                                                        {accountMsg && <p className={`text-xs ${accountMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{accountMsg}</p>}
                                                      </>
                                                    )}
                                                  </div>
                                                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{ts("password")}</span>
                  <span className="text-sm font-medium text-[#2D3436]">
                    {profile.hasPassword ? ts("hasPassword") : ts("noPassword")}
                    <button
                      onClick={() => {
                        if (profile?.isDemoUser) {
                          setGlobalToast(ts("demoToast"))
                          setTimeout(() => setGlobalToast(""), 3000)
                          return
                        }
                        setShowPasswordForm(!showPasswordForm)
                      }}
                      className="ml-2 text-[#FF6B35] text-xs hover:underline"
                    >
                      {profile.hasPassword ? ts("modify") : ts("set")}
                    </button>
                  </span>
                </div>
                {showPasswordForm && (
                  <div className="py-3 border-b border-gray-50">
                    <PasswordForm
                      hasPassword={profile.hasPassword ?? false}
                      onClose={() => setShowPasswordForm(false)}
                      ts={ts}
                      tv={tv}
                      locale={locale}
                    />
                  </div>
                )}
                {accountMsg && (
                  <div className={`py-2 text-sm text-center ${accountMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
                    {accountMsg}
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">{ts("registerDate")}</span>
                  <span className="text-sm font-medium text-[#2D3436]">{new Date(profile.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">{ts("currentPlan")}</span>
                  <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                    settings.subscriptionTier === "PRO" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {settings.subscriptionTier === "PRO" ? ts("proPlan") : ts("freePlan")}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">{ts("profileLoading")}</p>
            )}
            <Link href="/app/billing" className="inline-block mt-4 bg-gradient-to-r from-[#FF6B35] to-orange-400 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90">
              {settings.subscriptionTier === "PRO" ? ts("manageSubscription") : ts("upgradePlan")}
            </Link>
          </div>
        </div>

        {/* Right column: Diet preferences */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-50 p-6 h-full">
          <h2 className="font-bold text-[#2D3436] mb-4">{ts("dietPreferences")}</h2>
          <div className="space-y-5">
            <div>
              <label className="text-sm text-gray-600 font-medium">{ts("dietType")}</label>
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
                    {dietLabel[opt]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium">{ts("cuisinePref")}</label>
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
                      {selected ? "✓" : ""} {cuisineLabel[opt]}
                    </button>
                  )
                })}
              </div>
              {settings.cuisinePref.length >= 1 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {ts("selectedCuisines", { count: settings.cuisinePref.length })}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-600">{ts("servingSizeLabel")}</label>
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
              onClick={() => {
                if (profile?.isDemoUser) {
                  setGlobalToast(ts("demoToast"))
                  setTimeout(() => setGlobalToast(""), 3000)
                  return
                }
                save()
              }}
              disabled={saving || settings.cuisinePref.length === 0}
              className="bg-[#FF6B35] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all"
            >
              {saving ? ts("saving") : ts("saveSettings")}
            </button>
            {saved && (
              <span className={`text-sm text-green-600 transition-opacity duration-300 ${showSaved ? 'opacity-100' : 'opacity-0'}`}>
                {ts("saved")}
              </span>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      </div>

      {/* Data management */}
      {!profile?.isDemoUser && (
        <div className="bg-white rounded-2xl border border-orange-50 shadow-sm p-6 mt-6">
          <h2 className="font-bold text-[#2D3436] mb-4">{ts("dataManagement")}</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/user/export")
                  if (!res.ok) { setError(ts("exportFailed")); return }
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `cookmate-export-${new Date().toISOString().split("T")[0]}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                } catch { setError(ts("exportFailed")) }
              }}
              className="border border-gray-200 text-sm text-gray-600 px-4 py-2 rounded-full hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
            >
              {ts("exportData")}
            </button>
            <button
              onClick={async () => {
                if (!confirm(ts("deleteConfirm"))) return
                try {
                  const res = await fetch("/api/user/delete", { method: "POST" })
                  const data = await res.json()
                  if (data.success) {
                    window.location.href = "/"
                  } else {
                    setError(data.error || ts("deleteFailed"))
                  }
                } catch { setError(ts("deleteFailed")) }
              }}
              className="border border-red-200 text-sm text-red-500 px-4 py-2 rounded-full hover:bg-red-50 transition-colors"
            >
              {ts("deleteAccount")}
            </button>
          </div>
        </div>
      )}

      {/* Global toast */}
      {globalToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D3436] text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          {globalToast}
        </div>
      )}
    </div>
  )
}

function PasswordForm({ hasPassword, onClose, ts, tv, locale }: { hasPassword: boolean; onClose: () => void; ts: (key: string) => string; tv: (key: string) => string; locale: string }) {
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  const handleSubmit = async () => {
    if (newPassword.length < 8) { setMsg(tv("passwordTooShort")); return }
    if (newPassword !== confirm) { setMsg(tv("passwordMismatch")); return }
    setSaving(true)
    setMsg("")
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword, locale }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg(hasPassword ? ts("passwordUpdatedModify") : ts("passwordUpdatedSet"))
        setNewPassword("")
        setConfirm("")
        setTimeout(onClose, 1500)
      } else {
        setMsg(`❌ ${data.error || ts("operationFailed")}`)
      }
    } catch (err) {
      console.error("set password error:", err)
      setMsg(`❌ ${tv("networkError")}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500">{ts("passwordFormNewPassword")}</label>
        <PasswordInput
          placeholder={ts("passwordFormPlaceholder")}
          value={newPassword}
          onChange={setNewPassword}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35] mt-1"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500">{ts("passwordFormConfirm")}</label>
        <PasswordInput
          placeholder={ts("passwordFormConfirmPlaceholder")}
          value={confirm}
          onChange={setConfirm}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35] mt-1"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !newPassword || !confirm}
          className="bg-[#FF6B35] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:bg-gray-300 transition-all whitespace-nowrap"
        >
          {saving ? ts("passwordFormSaving") : (hasPassword ? ts("passwordFormModify") : ts("passwordFormSet"))}
        </button>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 whitespace-nowrap">{ts("passwordFormCancel")}</button>
      </div>
      {msg && (
        <p className={`text-xs ${msg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{msg}</p>
      )}
    </div>
  )
}