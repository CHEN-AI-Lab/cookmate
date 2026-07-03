"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DIET_OPTIONS, CUISINE_OPTIONS, SERVING_SIZE_OPTIONS } from "@cookmate/shared/constants"

export default function SettingsPage() {
  const [settings, setSettings] = useState({ dietType: "不限", cuisinePref: [] as string[], servingSize: 2, subscriptionTier: "FREE" })
  const [profile, setProfile] = useState<{ name: string; phone: string; email: string; loginMethod: string; createdAt: string; hasPassword?: boolean } | null>(null)
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
  const [bindEmailPwd, setBindEmailPwd] = useState("")
  const [bindCodeSent, setBindCodeSent] = useState(false)
  const [bindLoading, setBindLoading] = useState(false)
  const [bindCountdown, setBindCountdown] = useState(0)
  const [bindError, setBindError] = useState("")
  const [accountMsg, setAccountMsg] = useState("")

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
          setProfile({ ...profileData, hasPassword: profileData.hasPassword })
        }
      })
      .catch(() => {})
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
        setAccountMsg("✅ 用户名已更新")
        setTimeout(() => setAccountMsg(""), 3000)
      } else {
        const d = await r.json()
        setAccountMsg(d.error || "更新失败")
        setTimeout(() => setAccountMsg(""), 3000)
      }
    } catch {
      setAccountMsg("网络错误")
      setTimeout(() => setAccountMsg(""), 3000)
    }
  }

const save = async () => {
    // 至少选择一个菜系
    if (settings.cuisinePref.length === 0) {
      setError("请至少选择一个菜系")
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
                                    <button onClick={saveName} className="text-xs text-[#FF6B35] hover:underline">保存</button>
                                    <button onClick={() => setEditingName(false)} className="text-xs text-gray-400 hover:text-gray-600">取消</button>
                                  </div>
                                ) : (
                                  <>
                                    {profile.name || "未设置"}
                                    <button onClick={() => { setEditNameValue(profile.name || ""); setEditingName(true) }} className="ml-2 text-[#FF6B35] text-xs hover:underline">修改</button>
                                  </>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                              <span className="text-sm text-gray-500">登录方式</span>
                  <span className="text-sm font-medium text-[#2D3436]">{profile.loginMethod}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">手机号</span>
                  <span className="text-sm font-medium text-[#2D3436]">
                    {profile.phone ? profile.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "未绑定"}
                    {!profile.phone && (
                      <button
                        onClick={() => setShowBindPhone(!showBindPhone)}
                        className="ml-2 text-[#FF6B35] text-xs hover:underline"
                      >
                        绑定
                      </button>
                    )}
                  </span>
                </div>
                {showBindPhone && (
                                  <div className="py-3 border-b border-gray-50 space-y-3">
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs text-amber-700 font-medium">⚠️ 重要提醒</p>
                      <p className="text-xs text-amber-600 mt-1">手机号一旦绑定，后续不可修改或解绑。请务必输入您本人正在使用的手机号码。</p>
                    </div>
                    <input
                      type="tel" maxLength={11} placeholder="输入手机号"
                      value={bindPhone}
                      onChange={(e) => setBindPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35]"
                    />
                    {profile?.hasPassword && (
                    <input
                      type="password" placeholder="输入当前密码验证身份"
                      value={bindCode}
                      onChange={(e) => setBindCode(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35]"
                    />
                    )}
                    <button
                      onClick={async () => {
                        if (!/^1[3-9]\d{9}$/.test(bindPhone)) { setBindError("请输入正确的11位手机号"); return }
                        if (bindPhone === '11111111111' || bindPhone === '00000000000' || bindPhone === '12345678901' || /^1(\d)\1{9}$/.test(bindPhone)) { setBindError("请输入真实的手机号码"); return }
                        if (profile?.hasPassword && (!bindCode || bindCode.length < 8)) { setBindError("请输入正确的密码（至少 8 位）"); return }
                        if (profile?.hasPassword) {
                          let pwdTypes = 0;
                          if (/[a-z]/.test(bindCode)) pwdTypes++;
                          if (/[A-Z]/.test(bindCode)) pwdTypes++;
                          if (/[0-9]/.test(bindCode)) pwdTypes++;
                          if (/[^a-zA-Z0-9]/.test(bindCode)) pwdTypes++;
                          if (pwdTypes < 2) { setBindError("密码需包含至少两种字符（大小写字母、数字、符号）"); return }
                        }
                        setBindLoading(true)
                        setBindError("")
                        try {
                          const body: any = { phone: bindPhone }
                          if (bindCode) body.password = bindCode
                          const r = await fetch("/api/user/profile", {
                            method: "PUT", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                          })
                          const d = await r.json()
                          if (r.ok) {
                            setProfile((p) => p ? { ...p, phone: bindPhone } : p)
                            setShowBindPhone(false)
                            setAccountMsg("✅ 手机号绑定成功")
                            setTimeout(() => setAccountMsg(""), 3000)
                          } else {
                            setBindError(d.error || "绑定失败")
                          }
                        } catch { setBindError("网络错误") }
                        finally { setBindLoading(false) }
                      }}
                      disabled={bindLoading || !bindPhone || (profile?.hasPassword && !bindCode)}
                      className="w-full bg-[#FF6B35] text-white rounded-xl py-2 text-sm font-medium hover:bg-orange-600 disabled:bg-gray-300"
                    >
                      {bindLoading ? "绑定中..." : "确认绑定"}
                    </button>
                    {bindError && <p className="text-xs text-red-500">{bindError}</p>}
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                  <span className="text-sm text-gray-500">邮箱</span>
                                  <span className="text-sm font-medium text-[#2D3436]">
                                    {profile.email || "未绑定"}
                                    {!profile.email && !showBindEmail && (
                                      <button onClick={() => setShowBindEmail(true)} className="ml-2 text-[#FF6B35] text-xs hover:underline">绑定</button>
                                    )}
                                  </span>
                                </div>
                                {showBindEmail && (
                                  <div className="py-3 border-b border-gray-50 space-y-3">
                                    <input type="email" placeholder="输入新邮箱" value={bindEmail} onChange={(e) => setBindEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35]" />
                                    <input type="password" placeholder="输入当前密码验证身份" value={bindEmailPwd} onChange={(e) => setBindEmailPwd(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35]" />
                                    <button
                                      onClick={async () => {
                                        if (!bindEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(bindEmail)) { setAccountMsg("请输入正确邮箱"); setTimeout(() => setAccountMsg(""), 3000); return }
                                        if (!bindEmailPwd || bindEmailPwd.length < 8) { setAccountMsg("请输入正确的密码（至少 8 位）"); setTimeout(() => setAccountMsg(""), 3000); return }
                                        setBindLoading(true)
                                        try {
                                          const r = await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: bindEmail, password: bindEmailPwd }) })
                                          const d = await r.json()
                                          if (r.ok) { setProfile((p) => p ? { ...p, email: bindEmail } : p); setShowBindEmail(false); setAccountMsg("✅ 邮箱绑定成功"); setTimeout(() => setAccountMsg(""), 3000) }
                                          else { setAccountMsg(d.error || "绑定失败"); setTimeout(() => setAccountMsg(""), 3000) }
                                        } catch { setAccountMsg("网络错误"); setTimeout(() => setAccountMsg(""), 3000) }
                                        finally { setBindLoading(false) }
                                      }}
                                      disabled={bindLoading || !bindEmail || !bindEmailPwd}
                                      className="w-full bg-[#FF6B35] text-white rounded-xl py-2 text-sm font-medium hover:bg-orange-600 disabled:bg-gray-300"
                                    >{bindLoading ? "绑定中..." : "确认绑定"}</button>
                                    {accountMsg && <p className="text-xs text-red-500">{accountMsg}</p>}
                                  </div>
                                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">密码</span>
                  <span className="text-sm font-medium text-[#2D3436]">
                    {profile.hasPassword ? "已设置" : "未设置"}
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="ml-2 text-[#FF6B35] text-xs hover:underline"
                    >
                      {profile.hasPassword ? "修改" : "设置"}
                    </button>
                  </span>
                </div>
                {showPasswordForm && (
                  <div className="py-3 border-b border-gray-50">
                    <PasswordForm
                      hasPassword={profile.hasPassword ?? false}
                      onClose={() => setShowPasswordForm(false)}
                    />
                  </div>
                )}
                {accountMsg && (
                  <div className={`py-2 text-sm text-center ${accountMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
                    {accountMsg}
                  </div>
                )}
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

      {/* 密码设置 - 已整合到账号信息中 */}

      {/* 密码设置 - 已整合到账号信息中 */}
    </div>
  )
}

function PasswordForm({ hasPassword, onClose }: { hasPassword: boolean; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  const handleSubmit = async () => {
    if (newPassword.length < 8) { setMsg("密码至少 8 位"); return }
    if (newPassword !== confirm) { setMsg("两次密码不一致"); return }
    setSaving(true)
    setMsg("")
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg("✅ 密码已" + (hasPassword ? "修改" : "设置"))
        setNewPassword("")
        setConfirm("")
        setTimeout(onClose, 1500)
      } else {
        setMsg(`❌ ${data.error || "操作失败"}`)
      }
    } catch {
      setMsg("❌ 网络错误")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500">新密码</label>
        <input
          type="password"
          placeholder="至少 8 位，需含 2 种以上字符"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35] mt-1"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500">确认新密码</label>
        <input
          type="password"
          placeholder="再次输入新密码"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35] mt-1"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !newPassword || !confirm}
          className="bg-[#FF6B35] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:bg-gray-300 transition-all whitespace-nowrap"
        >
          {saving ? "保存中..." : hasPassword ? "修改密码" : "设置密码"}
        </button>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 whitespace-nowrap">取消</button>
      </div>
      {msg && (
        <p className={`text-xs ${msg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>{msg}</p>
      )}
    </div>
  )
}