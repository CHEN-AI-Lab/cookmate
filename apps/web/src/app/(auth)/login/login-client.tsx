"use client"

import { signIn, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"

export default function LoginClient({ isLoggedIn, userName }: { isLoggedIn?: boolean; userName?: string }) {
  const [tab, setTab] = useState<"phone" | "email" | "password">("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [emailCode, setEmailCode] = useState("")
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timerRef.current ?? undefined)
  }, [countdown])

  const sendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      setError("请输入正确的11位手机号")
      return
    }
    setLoading("send")
    setError("")
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "发送失败")
        return
      }
      setCountdown(60)
      if (data.devCode) {
        setCode(data.devCode)
        setError(`⚠️ 开发模式：验证码已自动填入 ${data.devCode}`)
      } else {
        setError("验证码已发送，请查收手机短信")
        setTimeout(() => setError(""), 3000)
      }
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setLoading(null)
    }
  }

  const handlePhoneLogin = async () => {
    if (!phone || !code) {
      setError("请输入手机号和验证码")
      return
    }
    setLoading("phone")
    setError("")
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "验证失败")
        return
      }
      window.location.href = "/app/dashboard"
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setLoading(null)
    }
  }

  const handleEmailLogin = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请输入正确的邮箱地址")
      return
    }
    setLoading("email")
    setError("")
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "发送失败")
        return
      }
      if (data.devCode) {
        setEmailCode(data.devCode)
        setEmailCodeSent(true)
        setError(`⚠️ 开发模式：验证码 ${data.devCode}`)
      } else {
        setEmailCodeSent(true)
        setError("验证码已发送到您的邮箱，请查收")
      }
      setCountdown(60)
    } catch {
      setError("发送失败，请稍后重试")
    } finally {
      setLoading(null)
    }
  }

  const handleEmailVerify = async () => {
    if (!email || !emailCode) {
      setError("请输入邮箱和验证码")
      return
    }
    setLoading("email_login")
    setError("")
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: emailCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "验证失败")
        return
      }
      window.location.href = "/app/dashboard"
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setLoading(null)
    }
  }

  const handlePasswordLogin = async () => {
    if (!email || (!/^1\d{10}$/.test(email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setError("请输入正确的邮箱或手机号")
      return
    }
    if (!password) {
      setError("请输入密码")
      return
    }
    setLoading("password")
    setError("")
    try {
      const result = await signIn("password", {
        account: email,
        password,
        redirect: false,
      })
      if (result?.error) {
        if (result.error === "NO_PASSWORD_SET") {
          setError("该账号未设置密码，请使用验证码登录，或先到设置页设置密码")
        } else {
          setError("邮箱/手机号或密码错误")
        }
      } else {
        window.location.href = result?.url || "/app/dashboard"
      }
    } catch {
      setError("登录失败，请稍后重试")
    } finally {
      setLoading(null)
    }
  }

  const handleOAuth = async (provider: string) => {
    setLoading(provider)
    setError("")
    try {
      const result = await signIn(provider, { callbackUrl: "/app/dashboard", redirect: false })
      if (result?.error) {
        setError("登录失败，请重试")
      } else {
        window.location.href = result?.url || "/app/dashboard"
      }
    } catch {
      setError("该登录方式尚未配置，上线后即可使用")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl">🍳</Link>
          <h1 className="text-2xl font-bold text-[#2D3436] mt-2">登录 CookMate</h1>
          <p className="text-gray-500 mt-1">选择您喜欢的方式登录</p>
        </div>

        {isLoggedIn && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-700 font-medium">
              {userName ? `👋 ${userName}` : "您已登录"}
            </p>
            <p className="text-xs text-blue-500 mt-1">要切换到其他账号，请先退出</p>
            <div className="mt-3 flex gap-2">
              <Link href="/app/dashboard" className="flex-1 bg-blue-600 text-white text-center text-sm py-2 rounded-lg hover:bg-blue-700">进入仪表盘</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="flex-1 bg-white text-gray-600 text-center text-sm py-2 rounded-lg border border-gray-200 hover:bg-gray-50">退出登录</button>
            </div>
          </div>
        )}

        {error && (
          <div className={`mb-4 p-3 rounded-xl text-sm text-center ${
            error.includes("自动填入") ? "bg-green-50 border border-green-200 text-green-600"
            : error.includes("已发送") ? "bg-blue-50 border border-blue-200 text-blue-600"
            : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            {error}
          </div>
        )}

        {/* 登录方式切换标签 */}
        <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTab("phone")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === "phone" ? "bg-white text-[#2D3436] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📱 手机号
          </button>
          <button
            onClick={() => setTab("email")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === "email" ? "bg-white text-[#2D3436] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📧 邮箱
          </button>
          <button
            onClick={() => setTab("password")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === "password" ? "bg-white text-[#2D3436] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🔑 密码
          </button>
        </div>

        {/* 手机号登录 */}
        {tab === "phone" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 font-medium">手机号</label>
              <div className="flex gap-2 mt-1.5">
                <input
                  type="tel"
                  maxLength={11}
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 bg-white"
                />
                <button
                  onClick={sendCode}
                  disabled={loading === "send" || countdown > 0}
                  className="px-4 py-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 whitespace-nowrap transition-colors"
                >
                  {countdown > 0 ? `${countdown}s` : loading === "send" ? "发送中..." : "获取验证码"}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium">验证码</label>
              <input
                type="text"
                maxLength={6}
                placeholder="请输入6位验证码"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 bg-white mt-1.5"
              />
            </div>
            <button
              onClick={handlePhoneLogin}
              disabled={loading === "phone" || !phone || !code}
              className="w-full bg-[#FF6B35] text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 transition-all"
            >
              {loading === "phone" ? "登录中..." : "登录 / 注册"}
            </button>
          </div>
        )}

        {/* 邮箱登录 */}
        {tab === "email" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 font-medium">邮箱地址</label>
              <div className="flex gap-2 mt-1.5">
                <input
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailCodeSent(false) }}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 bg-white"
                />
                <button
                  onClick={handleEmailLogin}
                  disabled={loading === "email" || countdown > 0 || !email}
                  className="px-4 py-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 whitespace-nowrap transition-colors"
                >
                  {countdown > 0 ? `${countdown}s` : loading === "email" ? "发送中..." : "获取验证码"}
                </button>
              </div>
            </div>
            {emailCodeSent && (
              <div>
                <label className="text-sm text-gray-600 font-medium">验证码</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="请输入6位验证码"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 bg-white mt-1.5"
                />
              </div>
            )}
            {emailCodeSent ? (
              <button
                onClick={handleEmailVerify}
                disabled={loading === "email_login" || !emailCode}
                className="w-full bg-[#FF6B35] text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 transition-all"
              >
                {loading === "email_login" ? "登录中..." : "登录 / 注册"}
              </button>
            ) : (
              <p className="text-xs text-gray-400 text-center">点击"获取验证码"，验证码将发送到您的邮箱</p>
            )}
          </div>
        )}

        {/* 密码登录 */}        {tab === "password" && (          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 font-medium">邮箱 / 手机号</label>
              <input
                type="text"
                placeholder="请输入邮箱或手机号"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 bg-white mt-1.5"
              />
            </div>            <div>              <label className="text-sm text-gray-600 font-medium">密码</label>              <input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 bg-white mt-1.5"
              />            </div>            <button
              onClick={handlePasswordLogin}
              disabled={loading === "password" || !email || !password}
              className="w-full bg-[#FF6B35] text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 transition-all"
            >
              {loading === "password" ? "登录中..." : "登录"}
            </button>          </div>        )}

        {/* 社交账号登录 */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">社交账号</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleOAuth("google")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <span className="text-lg">G</span>
            <span className="text-sm font-medium text-gray-700">Google</span>
          </button>
          <button
            onClick={() => handleOAuth("github")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <span className="text-lg">🐙</span>
            <span className="text-sm font-medium text-gray-700">GitHub</span>
          </button>
          <button
            onClick={() => handleOAuth("wechat")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <span className="text-lg">💚</span>
            <span className="text-sm font-medium text-gray-700">微信</span>
          </button>
          <button
            onClick={() => handleOAuth("alipay")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <span className="text-lg">💙</span>
            <span className="text-sm font-medium text-gray-700">支付宝</span>
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={() => handleOAuth("demo")}
            disabled={loading !== null}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-orange-400 text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading === "demo" ? "登录中..." : "🚀 体验演示版"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          还没有账号？<Link href="/register" className="text-[#FF6B35] hover:underline">注册</Link>
        </p>
      </div>
    </div>
  )
}