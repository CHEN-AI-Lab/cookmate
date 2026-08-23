"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations, useLocale } from "next-intl"
import { signIn, signOut } from "next-auth/react"
import Link from "next/link"
import PasswordInput from "@/components/ui/PasswordInput"
import { DIET_OPTIONS, CUISINE_OPTIONS, SERVING_SIZE_OPTIONS } from "@cookmate/shared/constants"

export default function SettingsPage() {
  const ts = useTranslations("settings")
  const tc = useTranslations("common")
  const tv = useTranslations("validation")
  const ta = useTranslations("auth")
  const locale = useLocale()
  const router = useRouter()

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
  const [profile, setProfile] = useState<{ name: string; phone: string; email: string; loginMethod: string; createdAt: string; hasPassword?: boolean; isDemoUser?: boolean; googleConfigured?: boolean; githubConfigured?: boolean; accounts: { provider: string }[] } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteCode, setDeleteCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
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
  const [bindError, setBindError] = useState("")
  const [globalToast, setGlobalToast] = useState("")
  // ── Unlink OAuth ──
  const [unlinkConfirmProvider, setUnlinkConfirmProvider] = useState<string | null>(null)
  const [unlinking, setUnlinking] = useState<string | null>(null)
  const [unlinkError, setUnlinkError] = useState("")
  const [needsManualRevoke, setNeedsManualRevoke] = useState(false); void needsManualRevoke
  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/user/profile").then((r) => r.json()),
    ])
      .then(([settingsData, profileData]) => {
        const profileDataAny = profileData as Record<string, unknown>
        const isDemo = !!(profileDataAny.isDemoUser)
        if (settingsData.settings || isDemo) {
          setSettings({
            dietType: settingsData.settings?.dietType ?? DIET_OPTIONS[0],
            cuisinePref: isDemo
              ? [...CUISINE_OPTIONS]
              : settingsData.settings?.cuisinePref
                ? settingsData.settings.cuisinePref.split(",").filter(Boolean)
                : [],
            servingSize: settingsData.settings?.servingSize ?? 2,
            subscriptionTier: settingsData.settings?.subscriptionTier ?? "FREE",
          })
        }
        if (profileData.name !== undefined) {
          setProfile({ ...profileData, hasPassword: profileData.hasPassword, isDemoUser: !!profileData.isDemoUser })
        }
      })
      .catch((err) => console.error("load settings error:", err))
      .finally(() => setLoading(false))
  }, [])

  // OAuth 关联回跳：提示结果并清理 URL 参数（linkError=bound 邮箱/账号已被其他账号绑定）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const linkError = params.get("linkError")
    const linked = params.get("linked")
    if (linkError) {
      if (linkError === "failed") {
        setTimeout(() => setGlobalToast(ta("linkFailed")), 0)
      } else if (linkError === "bound") {
        const providerParam = params.get("provider") || ""
        const providerNames: Record<string, string> = { google: "Google", github: "GitHub" }
        const providerName = providerNames[providerParam] || providerParam
        setTimeout(() => setGlobalToast(providerName ? ta("linkAccountBound", { provider: providerName }) : ta("linkEmailTaken")), 0)
      } else {
        setTimeout(() => setGlobalToast(ta("linkEmailTaken")), 0)
      }
      setTimeout(() => setGlobalToast(""), 6000)
      window.history.replaceState({}, "", `/${locale}/app/settings`)
    } else if (linked) {
      setTimeout(() => setGlobalToast(ta("linkSuccess")), 0)
      setTimeout(() => setGlobalToast(""), 6000)
      window.history.replaceState({}, "", `/${locale}/app/settings`)
    }
  }, [locale, ta])

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
        setGlobalToast(ts("nameUpdated"))
        setTimeout(() => setGlobalToast(""), 3000)
      } else {
        const d = await r.json()
        setGlobalToast(d.error || ts("updateFailed"))
        setTimeout(() => setGlobalToast(""), 3000)
      }
    } catch (err) {
      console.error("save name error:", err)
      setGlobalToast(tv("networkError"))
      setTimeout(() => setGlobalToast(""), 3000)
    }
  }

  const sendBindEmailCode = async () => {
    if (!bindEmail || !/^[^\s]+@[^\s]+\.[^\s]+$/.test(bindEmail)) { setGlobalToast(tv("invalidEmail")); setTimeout(() => setGlobalToast(""), 3000); return }
    setBindLoading(true)
    try {
      const r = await fetch("/api/user/bind-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: bindEmail, locale }) })
      const d = await r.json()
      if (r.ok) { setBindCodeSent(true); setGlobalToast(ts("codeSentToEmail", { email: bindEmail })); setTimeout(() => setGlobalToast(""), 3000) }
      else { setGlobalToast(d.error || tv("sendFailed")); setTimeout(() => setGlobalToast(""), 3000) }
    } catch (err) { console.error("send bind email code error:", err); setGlobalToast(tv("networkError")); setTimeout(() => setGlobalToast(""), 3000) }
    finally { setBindLoading(false) }
  }

  const confirmBindEmail = async () => {
    if (!bindEmailCode || bindEmailCode.length < 6) { setGlobalToast(tv("emptyCode")); setTimeout(() => setGlobalToast(""), 3000); return }
    setBindLoading(true)
    try {
      const r = await fetch("/api/user/bind-email", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: bindEmail, code: bindEmailCode, locale }) })
      const d = await r.json()
      if (r.ok) { setProfile((p) => p ? { ...p, email: bindEmail } : p); setShowBindEmail(false); setBindCodeSent(false); setBindEmail(""); setBindEmailCode(""); setGlobalToast(ts("bindSuccessEmail")); setTimeout(() => setGlobalToast(""), 3000) }
      else { setGlobalToast(d.error || ts("bindFailed")); setTimeout(() => setGlobalToast(""), 3000) }
    } catch (err) { console.error("confirm bind email error:", err); setGlobalToast(tv("networkError")); setTimeout(() => setGlobalToast(""), 3000) }
    finally { setBindLoading(false) }
  }

  // ── OAuth 解绑 ──
  const handleUnlinkClick = (provider: string) => {
    setUnlinkConfirmProvider(provider)
    setUnlinkError("")
    setNeedsManualRevoke(false)
  }

  // ── 关联 OAuth：已登录用户点"关联" → 走 OAuth 授权 → Auth.js 自动把新账号绑到当前用户 ──
  const handleLink = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: `/${locale}/app/settings?linked=${provider}` })
    } catch {
      setGlobalToast(ta("linkFailed"))
      setTimeout(() => setGlobalToast(""), 3000)
    }
  }

  const handleUnlinkConfirm = async () => {
    if (!unlinkConfirmProvider) return
    setUnlinking(unlinkConfirmProvider)
    try {
      const res = await fetch("/api/user/unlink-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: unlinkConfirmProvider }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfile((p) => p ? { ...p, accounts: (p.accounts || []).filter((a) => a.provider !== unlinkConfirmProvider) } : p)
        setUnlinkConfirmProvider(null)
        if (data.needsManualRevoke) {
          setNeedsManualRevoke(true)
          setGlobalToast(ta("githubRevokeNote"))
          setTimeout(() => setGlobalToast(""), 6000)
        } else {
          setGlobalToast(ta("unlinkSuccess"))
          setTimeout(() => setGlobalToast(""), 3000)
        }
      } else {
        setUnlinkError(ta("unlinkFailed"))
      }
    } catch { setUnlinkError(ta("unlinkFailed")) }
    finally { setUnlinking(null) }
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

  const handleSendDeleteCode = async () => {
    setDeleteError("")
    setSendingCode(true)
    try {
      const res = await fetch("/api/user/delete/send-code", { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setDeleteError(data.error || ts("sendCodeFailed")); return }
      if (data.devCode) setDeleteCode(data.devCode)
      setCodeSent(true)
    } catch { setDeleteError(ts("sendCodeFailed"))
    } finally { setSendingCode(false) }
  }

  const handleDelete = async () => {
    setDeleteError("")
    setDeleting(true)
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile?.email, code: deleteCode }),
      })
      const data = await res.json()
      if (data.success) {
        await signOut({ redirect: false })
        router?.push("/")
      } else {
        setDeleteError(data.error || ts("deleteFailed"))
      }
    } catch {
      setDeleteError(ts("deleteFailed"))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">{tc("loading")}</div>

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">{ts("title")}</h1>
        <p className="text-sm text-gray-400 mt-1">{ts("subtitle")}</p>
      </div>

      {profile?.isDemoUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-center">
          <p className="font-semibold text-amber-800 mb-1">{tc("demoMode")}</p>
          <p className="text-sm text-amber-700 mb-3">
            {ts("demoDesc")}<br />
            {ts("demoRegisterHint")}
          </p>
          <Link
            href="/register"
            className="inline-block bg-accent text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-all"
          >
            {tc("freeRegister")}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left column: Account info + Plan */}
        <div className="h-full">
          <div className="bg-card rounded-2xl shadow-sm border border-orange-50 overflow-hidden h-full">
            <div className="h-1 bg-gradient-to-r from-accent to-orange-300" />
            <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-sm shrink-0">👤</span>
              <h2 className="font-bold text-text-primary">{ts("profile")}</h2>
            </div>
            {profile ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-border">
                              <span className="text-sm text-text-secondary">{ts("username")}</span>
                              <span className="text-sm font-medium text-text-primary">
                                {editingName ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editNameValue}
                                      onChange={(e) => setEditNameValue(e.target.value)}
                                      maxLength={30}
                                      className="border border-gray-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-accent w-32"
                                      autoFocus
                                      onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false) }}
                                    />
                                    <button onClick={saveName} className="text-xs text-accent hover:underline">{ts("saveName")}</button>
                                    <button onClick={() => setEditingName(false)} className="text-xs text-gray-400 hover:text-text-secondary">{ts("cancelName")}</button>
                                  </div>
                                ) : (
                                  <>
                                    {profile?.isDemoUser && (locale === "en" || locale.startsWith("en")) ? "Demo User" : profile.name || ts("notSet")}
                                    <button onClick={() => { if (profile?.isDemoUser) { setGlobalToast(ts("demoToast")); setTimeout(() => setGlobalToast(""), 3000); return } setEditNameValue(profile.name || ""); setEditingName(true) }} className="ml-2 text-accent text-xs hover:underline disabled:text-gray-300 disabled:cursor-not-allowed">{ts("editName")}</button>
                                  </>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border">
                              <span className="text-sm text-text-secondary">{ts("loginMethod")}</span>
                  <span className="text-sm font-medium text-text-primary">
                {profile?.isDemoUser && (locale === "en" || locale.startsWith("en"))
                  ? "Demo Login"
                  : locale.startsWith("zh")
                    ? profile.loginMethod
                    : ts("loginMethod_" + profile.loginMethod) || profile.loginMethod}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">{ts("phone")}</span>
                  <span className="text-sm font-medium text-text-primary">
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
                        className="ml-2 text-accent text-xs hover:underline"
                      >
                        {ts("bindAction")}
                      </button>
                    )}
                  </span>
                </div>
                {showBindPhone && (
                                <div className="py-3 border-b border-border space-y-3">
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                      <p className="text-xs text-amber-700 font-medium">{ts("bindWarningTitle")}</p>
                                      <p className="text-xs text-amber-600 mt-1">{ts("bindWarning")}</p>
                                    </div>
                                    <input
                                      type="tel" maxLength={11} placeholder={ts("bindPhonePlaceholder")}
                                      value={bindPhone}
                                      onChange={(e) => setBindPhone(e.target.value.replace(/\D/g, ""))}
                                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
                                    />
                                    <PasswordInput
                                                          placeholder={ts("bindPasswordPlaceholder")}
                                                          value={bindCode}
                                                          onChange={setBindCode}
                                                          className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
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
                                            setGlobalToast(ts("bindSuccessPhone"))
                                            setTimeout(() => setGlobalToast(""), 3000)
                                          } else {
                                            setBindError(d.error || ts("bindFailed"))
                                          }
                                        } catch (err) { console.error("bind phone error:", err); setBindError(tv("networkError")) }
                                        finally { setBindLoading(false) }
                                      }}
                                      disabled={bindLoading || !bindPhone || !bindCode}
                                      className="flex-1 bg-accent text-white rounded-xl py-2 text-sm font-medium hover:bg-orange-600 disabled:bg-surface"
                                    >
                                      {bindLoading ? ts("bindLoading") : ts("bindConfirm")}
                                    </button>
                                    <button onClick={() => { setShowBindPhone(false); setBindPhone(""); setBindCode(""); setBindError("") }} className="text-sm text-gray-400 hover:text-text-secondary px-3">{ts("bindCancel")}</button>
                                    </div>
                                    {bindError && <p className="text-xs text-red-600">{bindError}</p>}
                                  </div>
                                )}
                <div className="flex items-center justify-between py-2 border-b border-border">
                                  <span className="text-sm text-text-secondary">{ts("email")}</span>
                                  <span className="text-sm font-medium text-text-primary">
                                    {profile.email || ts("notBound")}
                                    {!profile.email && !showBindEmail && (
                                      <button onClick={() => { if (profile?.isDemoUser) { setGlobalToast(ts("demoToast")); setTimeout(() => setGlobalToast(""), 3000); return } setShowBindEmail(true) }} className="ml-2 text-accent text-xs hover:underline">{ts("bindAction")}</button>
                                                                        )}
                                  </span>
                                </div>
                                {showBindEmail && (
                                                  <div className="py-3 border-b border-border space-y-3">
                                                    <div className="flex gap-2">
                                                      <input type="email" placeholder={ts("bindEmailPlaceholder")} value={bindEmail} onChange={(e) => setBindEmail(e.target.value)} className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                                                      <button onClick={sendBindEmailCode} disabled={bindCodeSent || !bindEmail || !/^[^\s]+@[^\s]+\.[^\s]+$/.test(bindEmail)}
                                                        className="px-3 py-2 rounded-xl text-sm font-medium bg-surface text-text-secondary hover:bg-border disabled:opacity-40 whitespace-nowrap"
                                                      >{bindCodeSent ? ts("codeSent") : ts("getCode")}</button>
                                                      <button onClick={() => { setShowBindEmail(false); setBindCodeSent(false); setBindEmail(""); setBindEmailCode("") }} className="text-sm text-gray-400 hover:text-text-secondary px-2">{ts("bindCancel")}</button>
                                                    </div>
                                                    {bindCodeSent && (
                                                      <>
                                                        <input type="text" maxLength={6} placeholder={ts("bindCodePlaceholder")} value={bindEmailCode} onChange={(e) => setBindEmailCode(e.target.value.replace(/\D/g, ""))} className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent" />
                                                        <button onClick={confirmBindEmail}
                                                          disabled={bindLoading || !bindEmailCode || bindEmailCode.length < 6}
                                                          className="w-full bg-accent text-white rounded-xl py-2 text-sm font-medium hover:bg-orange-600 disabled:bg-surface"
                                                        >{bindLoading ? ts("bindLoading") : ts("bindConfirm")}</button>
                                                      </>
                                                    )}
                                                  </div>
                                                )}
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">{ts("password")}</span>
                  <span className="text-sm font-medium text-text-primary">
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
                      className="ml-2 text-accent text-xs hover:underline"
                    >
                      {profile.hasPassword ? ts("modify") : ts("set")}
                    </button>
                  </span>
                </div>
                {showPasswordForm && (
                  <div className="py-3 border-b border-border">
                    <PasswordForm
                      hasPassword={profile.hasPassword ?? false}
                      onClose={() => setShowPasswordForm(false)}
                      ts={ts}
                      tv={tv}
                      locale={locale}
                    />
                  </div>
                )}
                {/* OAuth Connected Accounts */}
                {profile && (profile.accounts.length > 0 || profile.googleConfigured || profile.githubConfigured) && (
                  <div className="flex items-center py-2 border-b border-border">
                    <span className="text-sm text-text-secondary">{ta("connectedAccounts")}</span>
                    <div className="flex gap-2 flex-wrap ml-auto">
                      {profile.accounts
                        .filter((a) => ["google", "github"].includes(a.provider))
                        .map((acc) => (
                          <span key={acc.provider} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-gray-100 rounded-lg text-xs text-text-primary">
                            {acc.provider === "google" && (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                            )}
                            {acc.provider === "github" && (
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.43 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016.02 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.87.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.82.58C20.57 21.8 24 17.31 24 12c0-6.63-5.37-12-12-12z"/></svg>
                            )}
                            {acc.provider === "google" ? "Google" : "GitHub"}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUnlinkClick(acc.provider) }}
                              className="text-gray-400 hover:text-red-600 transition-colors ml-1"
                              title={ta("unlink")}
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            </button>
                          </span>
                        ))}
                      {profile.googleConfigured && !profile.accounts.some((a) => a.provider === "google") && (
                        <button onClick={() => handleLink("google")}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-accent text-white rounded-lg text-xs hover:opacity-90 transition-opacity">
                          + {ta("linkGoogle")}
                        </button>
                      )}
                      {profile.githubConfigured && !profile.accounts.some((a) => a.provider === "github") && (
                        <button onClick={() => handleLink("github")}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-accent text-white rounded-lg text-xs hover:opacity-90 transition-opacity">
                          + {ta("linkGitHub")}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">{ts("registerDate")}</span>
                  <span className="text-sm font-medium text-text-primary">{new Date(profile.createdAt).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-text-secondary">{ts("currentPlan")}</span>
                  <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                    settings.subscriptionTier === "PRO" ? "bg-amber-100 text-amber-700" : "bg-surface text-text-secondary"
                  }`}>
                    {settings.subscriptionTier === "PRO" ? ts("proPlan") : ts("freePlan")}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">{ts("profileLoading")}</p>
            )}
            <Link href="/app/billing" className="inline-block mt-5 w-full text-center bg-gradient-to-r from-accent to-orange-400 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              {settings.subscriptionTier === "PRO" ? ts("manageSubscription") : ts("upgradePlan")}
            </Link>
          </div>
        </div>
        </div>

        {/* Right column: Diet preferences */}
        <div className="bg-card rounded-2xl shadow-sm border border-orange-50 overflow-hidden h-full">
                    <div className="h-1 bg-gradient-to-r from-green-400 to-green-200" />
                    <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center text-sm shrink-0">🥗</span>
                      <h2 className="font-bold text-text-primary">{ts("dietPreferences")}</h2>
                    </div>
                  <div className="space-y-5">
            <div>
              <label className="text-sm text-text-secondary font-medium">{ts("dietType")}</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DIET_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSettings({ ...settings, dietType: opt })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      settings.dietType === opt
                        ? "bg-accent text-white"
                        : "bg-surface text-text-secondary hover:bg-border"
                    }`}
                  >
                    {dietLabel[opt]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-text-secondary font-medium">{ts("cuisinePref")}</label>
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
                          ? "bg-accent text-white"
                          : "bg-surface text-text-secondary hover:bg-border"
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
              <label className="text-sm text-text-secondary">{ts("servingSizeLabel")}</label>
              <div className="flex items-center gap-2 mt-1.5">
                {SERVING_SIZE_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setSettings({ ...settings, servingSize: n })}
                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                      settings.servingSize === n
                        ? "bg-accent text-white"
                        : "bg-surface text-text-secondary hover:bg-border"
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
              className="bg-accent text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 disabled:bg-surface disabled:text-text-secondary disabled:cursor-not-allowed transition-all"
            >
              {saving ? ts("saving") : ts("saveSettings")}
            </button>
            {saved && (
              <span className={`text-sm text-green-600 transition-opacity duration-300 ${showSaved ? 'opacity-100' : 'opacity-0'}`}>
                {ts("saved")}
              </span>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        </div>
      </div>

      {/* ── Data Management ── */}
      {!profile?.isDemoUser && (
        <div className="mt-8">
          <h2 className="font-bold text-lg text-text-primary mb-4">{ts("dataManagement")}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── Export Data ── */}
          <div className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-sky-400 to-sky-200" />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text-primary">{ts("exportTitle")}</h3>
                  <p className="text-sm text-text-secondary mt-0.5">{ts("exportDesc")}</p>
                </div>
              </div>

              <div className="mt-4 bg-surface rounded-xl p-4">
                <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">{ts("exportIncludes")}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[ts("exportItem1"), ts("exportItem2"), ts("exportItem3"), ts("exportItem4"), ts("exportItem5"), ts("exportItem6")].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-text-secondary">
                      <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-surface text-text-secondary px-2 py-1 rounded-md font-mono font-semibold">JSON</span>
                  <span className="text-xs text-gray-400">{ts("exportFormatHint")}</span>
                </div>
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
                  className="inline-flex items-center gap-2 bg-sky-500 text-white text-sm px-5 py-2 rounded-full hover:bg-sky-600 transition-colors font-medium shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {ts("exportButton")}
                </button>
              </div>
            </div>
          </div>

          {/* ── Delete Account ── */}
          <div className="bg-card rounded-2xl border border-red-200 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-red-400 to-red-200" />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-red-600">{ts("deleteTitle")}</h3>
                  <p className="text-sm text-text-secondary mt-0.5">{ts("deleteDesc")}</p>
                </div>
              </div>

              <div className="mt-4 bg-red-500/5 rounded-xl p-4 border border-red-200">
                <p className="text-xs font-semibold text-red-600 mb-3 uppercase tracking-wide">{ts("deleteWarning")}</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-xs text-text-secondary">
                    <svg className="w-3.5 h-3.5 text-red-600/70 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {ts("deleteItem1")}
                  </li>
                  <li className="flex items-start gap-2 text-xs text-text-secondary">
                    <svg className="w-3.5 h-3.5 text-red-600/70 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {ts("deleteItem2")}
                  </li>
                  <li className="flex items-start gap-2 text-xs text-text-secondary">
                    <svg className="w-3.5 h-3.5 text-red-600/70 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {ts("deleteItem3")}
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-red-200">
                <span className="text-xs text-red-600/70">{ts("deleteNote")}</span>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-2 border border-red-300 text-red-600 text-sm px-5 py-2 rounded-full hover:bg-red-50 transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  {ts("deleteButton")}
                </button>
              </div>
            </div>
          </div>

        </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => { setShowDeleteModal(false); setDeleteCode(""); setCodeSent(false); setDeleteError("") }}>
          <div className="bg-card rounded-2xl shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <h3 className="font-bold text-lg text-red-600">{ts("deleteModalTitle")}</h3>
            </div>
            <p className="text-sm text-text-secondary mb-1">{ts("deleteWarning")}</p>
            <ul className="text-xs text-text-secondary mb-4 ml-4 list-disc space-y-1">
              <li>{ts("deleteItem1")}</li>
              <li>{ts("deleteItem2")}</li>
              <li>{ts("deleteItem3")}</li>
            </ul>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">{ts("deleteEmailLabel")}</label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-surface text-text-secondary cursor-not-allowed"
                  disabled
                />
              </div>

              {codeSent && (
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">{ts("deleteCodeLabel")}</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder={ts("deleteCodePlaceholder")}
                    value={deleteCode}
                    onChange={(e) => setDeleteCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-error focus:ring-1 focus:ring-error/20 text-center text-lg tracking-widest"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter" && deleteCode.length === 6) handleDelete() }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteCode(""); setCodeSent(false); setDeleteError("") }}
                className="flex-1 px-4 py-2.5 text-sm text-text-secondary border border-gray-100 rounded-xl hover:bg-surface transition-colors"
              >
                {tc("cancel")}
              </button>
              {!codeSent ? (
                <button
                  onClick={handleSendDeleteCode}
                  disabled={sendingCode || !profile?.email}
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-500 disabled:bg-surface transition-colors font-medium"
                >
                  {sendingCode ? ts("sendingCode") : ts("sendDeleteCode")}
                </button>
              ) : (
                <button
                  onClick={handleDelete}
                  disabled={deleting || deleteCode.length !== 6}
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-500 disabled:bg-surface transition-colors font-medium"
                >
                  {deleting ? ts("deleting") : ts("confirmDeleteBtn")}
                </button>
              )}
            </div>
            {deleteError && <p className="mt-3 text-xs text-red-600">{deleteError}</p>}
          </div>
        </div>
      )}

      {/* ── Unlink Confirmation Modal ── */}
      {unlinkConfirmProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setUnlinkConfirmProvider(null)}>
          <div className="bg-card rounded-2xl shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              </div>
              <h3 className="font-bold text-lg text-text-primary">{ta("unlink")}</h3>
            </div>
            <p className="text-sm text-text-secondary mb-1">{ta("unlinkConfirm", { provider: unlinkConfirmProvider === "google" ? "Google" : "GitHub" })}</p>
            {unlinkConfirmProvider === "github" && (
              <p className="text-xs text-gray-400 mt-2 mb-3">{ta("githubRevokeNote")}</p>
            )}
            {unlinkError && <p className="text-xs text-red-600 mt-2">{unlinkError}</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setUnlinkConfirmProvider(null)}
                className="flex-1 px-4 py-2.5 text-sm text-text-secondary border border-gray-100 rounded-xl hover:bg-surface transition-colors"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={handleUnlinkConfirm}
                disabled={unlinking !== null}
                className="flex-1 px-4 py-2.5 text-sm text-white bg-accent rounded-xl hover:bg-orange-600 disabled:bg-surface transition-colors font-medium"
              >
                {unlinking ? "..." : ta("unlink")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global toast */}
      {globalToast && (
        <div className="fixed top-1/3 left-4 sm:left-6 z-[100]">
          <div className="bg-accent text-white border border-border shadow-lg rounded-xl px-5 py-2.5 text-sm">
            {globalToast}
          </div>
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
        <label className="text-xs text-text-secondary">{ts("passwordFormNewPassword")}</label>
        <PasswordInput
          placeholder={ts("passwordFormPlaceholder")}
          value={newPassword}
          onChange={setNewPassword}
          className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent mt-1"
        />
      </div>
      <div>
        <label className="text-xs text-text-secondary">{ts("passwordFormConfirm")}</label>
        <PasswordInput
          placeholder={ts("passwordFormConfirmPlaceholder")}
          value={confirm}
          onChange={setConfirm}
          className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent mt-1"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !newPassword || !confirm}
          className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:bg-surface transition-all whitespace-nowrap"
        >
          {saving ? ts("passwordFormSaving") : (hasPassword ? ts("passwordFormModify") : ts("passwordFormSet"))}
        </button>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-text-secondary whitespace-nowrap">{ts("passwordFormCancel")}</button>
      </div>
      {msg && (
        <p className={`text-xs ${msg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{msg}</p>
      )}
    </div>
  )
}