"use client"

import { signIn, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import PasswordInput from "@/components/ui/PasswordInput"
import Link from "next/link"
import OAuthLoadingOverlay from "@/components/ui/OAuthLoadingOverlay"
import { useTranslations } from "next-intl"

export default function LoginClient({ isLoggedIn, userName }: { isLoggedIn?: boolean; userName?: string }) {
  const t = useTranslations('auth')
  const tv = useTranslations('validation')
  const tc = useTranslations('common')
  const [tab, setTab] = useState<"email" | "password">("email")
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [emailCode, setEmailCode] = useState("")
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [oauthProvider, setOauthProvider] = useState<string | null>(null)

  // 密码设置模式（在密码登录 tab 中设密码）
  const [passwordSetupMode, setPasswordSetupMode] = useState(false)
  const [setupCode, setSetupCode] = useState("")
  const [setupNewPassword, setSetupNewPassword] = useState("")
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("")
  const [setupCodeSent, setSetupCodeSent] = useState(false)
  const [setupCountdown, setSetupCountdown] = useState(0)
  const [emailMsg, setEmailMsg] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const alipayAuth = params.get("alipay_auth")
    if (alipayAuth) {
      window.history.replaceState({}, "", "/login")
      signIn("alipay-auth", { userId: alipayAuth, callbackUrl: "/app/dashboard" })
    }
  }, [])
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timerRef.current ?? undefined)
  }, [countdown])

  useEffect(() => {
    if (setupCountdown > 0) {
      const t = setTimeout(() => setSetupCountdown(setupCountdown - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [setupCountdown])

  const sendEmailCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(tv('invalidEmail'))
      return
    }
    setError("")
    setLoading("email")
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429 && data.remainingSeconds) {
          setCountdown(data.remainingSeconds)
          setError(data.error)
          return
        }
        setError(data.error || tv('sendFailed'))
        return
      }
      setEmailCodeSent(true)
      setCountdown(120)
      if (data.devCode) {
        setEmailCode(data.devCode)
        setError(tv('devCode', { code: data.devCode }))
      } else {
        setError("")
      }
    } catch {
      setError(tv('networkError'))
    } finally {
      setLoading(null)
    }
  }

  const handleEmailLogin = async () => {
    if (!email || !emailCode) {
      setError(tv('emptyEmailAndCode'))
      return
    }
    setLoading("email")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: emailCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tv('loginFailed'))
        return
      }
      await signIn("credentials", { email, code: emailCode, callbackUrl: "/app/dashboard" })
    } catch {
      setError(tv('networkError'))
    } finally {
      setLoading(null)
    }
  }

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      setError(tv('emptyEmailAndPassword'))
      return
    }
    setLoading("password")
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/app/dashboard",
      })
      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? tv('invalidCredentials') : result.error)
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch {
      setError(tv('networkError'))
    } finally {
      setLoading(null)
    }
  }

  // 发送设置密码的验证码
  const sendSetupCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(tv('invalidEmail'))
      return
    }
    setError("")
    setLoading("setup_code")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 404) {
          setError(tv('emailNotRegistered'))
          return
        }
        if (res.status === 429 && data.remainingSeconds) {
          setSetupCountdown(data.remainingSeconds)
          setError(data.error)
          return
        }
        setError(data.error || tv('sendFailed'))
        return
      }
      setSetupCodeSent(true)
      setSetupCountdown(120)
      if (data.devCode) {
        setSetupCode(data.devCode)
        setError(tv('devCode', { code: data.devCode }))
      } else {
        setError("")
      }
    } catch {
      setError(tv('networkError'))
    } finally {
      setLoading(null)
    }
  }

  // 提交密码设置
  const handleSetupPassword = async () => {
    if (!setupNewPassword || !setupConfirmPassword) {
      setError(tv('emptyPassword'))
      return
    }
    if (setupNewPassword !== setupConfirmPassword) {
      setError(tv('passwordMismatch'))
      return
    }
    if (setupNewPassword.length < 6) {
      setError(tv('passwordTooShort'))
      return
    }
    setLoading("setup")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: setupCode, password: setupNewPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tv('updateFailed'))
        return
      }
      setPasswordSetupMode(false)
      setEmailMsg(t('passwordUpdated'))
      setTimeout(() => setEmailMsg(""), 3000)
    } catch {
      setError(tv('networkError'))
    } finally {
      setLoading(null)
    }
  }

  const handleOAuth = (provider: string) => {
    setOauthProvider(provider)
    signIn(provider, { callbackUrl: "/app/dashboard" })
  }

  return (
    <>
      <OAuthLoadingOverlay provider={oauthProvider} />
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="text-2xl">🍳</Link>
          <h1 className="text-2xl font-bold text-[#2D3436] mt-4">{t('loginTitle')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('loginSubtitle')}</p>

          {/* 已登录提示 */}
          {isLoggedIn && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700">{t('alreadyLoggedIn', { name: userName || '' })}</p>
              <p className="text-xs text-blue-500 mt-1">{t('switchAccount')}</p>
              <Link href="/app/dashboard" className="block mt-2 bg-blue-600 text-white text-center text-sm py-2 rounded-lg hover:bg-blue-700">{t('enterDashboard')}</Link>
            </div>
          )}

          {!isLoggedIn && (
            <div className="mt-6">
              {/* Tab 切换 */}
              {!passwordSetupMode && (
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => { setTab("email"); setError(""); setEmailCodeSent(false); setEmailCode("") }}
                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${tab === "email" ? "text-[#FF6B35] border-[#FF6B35]" : "text-gray-400 border-transparent"}`}
                  >
                    {t('tabEmail')}
                  </button>
                  <button
                    onClick={() => { setTab("password"); setError("") }}
                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${tab === "password" ? "text-[#FF6B35] border-[#FF6B35]" : "text-gray-400 border-transparent"}`}
                  >
                    {t('tabPassword')}
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
              )}
              {emailMsg && (
                <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-xl px-4 py-3 mb-4">{emailMsg}</div>
              )}

              {tab === "email" && !passwordSetupMode && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">{t('emailLabel')}</label>
                    <input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] bg-white mt-1.5"
                    />
                  </div>
                  {!emailCodeSent ? (
                    <button
                      onClick={sendEmailCode}
                      disabled={loading === "email" || !email}
                      className="w-full bg-[#FF6B35] text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 transition-all"
                    >
                      {loading === "email" ? tc('sending') : tc('sendCode')}
                    </button>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm text-gray-600 font-medium">{t('codeLabel')}</label>
                        <input
                          type="text"
                          placeholder={t('codePlaceholder')}
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] bg-white mt-1.5"
                        />
                      </div>
                      <button
                        onClick={handleEmailLogin}
                        disabled={loading === "email" || !emailCode}
                        className="w-full bg-[#FF6B35] text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 transition-all"
                      >
                        {loading === "email" ? t('loggingIn') : t('loginAction')}
                      </button>
                      <button
                        onClick={sendEmailCode}
                        disabled={loading === "email" || countdown > 0}
                        className="w-full text-xs text-gray-400 hover:text-[#FF6B35] transition-colors"
                      >
                        {countdown > 0 ? `${countdown}s` : loading === "email" ? tc('sending') : tc('resend')}
                      </button>
                    </>
                  )}
                  <p className="text-xs text-gray-400 text-center">{t('sendCodeHint')}</p>
                </div>
              )}

              {tab === "password" && !passwordSetupMode && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">{t('emailLabel')}</label>
                    <input
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] bg-white mt-1.5"
                    />
                  </div>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder={t('passwordPlaceholder')}
                  />
                  <button
                    onClick={handlePasswordLogin}
                    disabled={loading === "password" || !email || !password}
                    className="w-full bg-[#FF6B35] text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 transition-all"
                  >
                    {loading === "password" ? t('loggingIn') : t('loginAction')}
                  </button>
                  <button
                    onClick={() => { setPasswordSetupMode(true); setError(""); setPassword(""); setSetupNewPassword(""); setSetupConfirmPassword(""); setSetupCode(""); setSetupCodeSent(false) }}
                    className="w-full text-xs text-gray-400 hover:text-[#FF6B35] transition-colors"
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
              )}

              {/* 密码设置 / 忘记密码 */}
              {passwordSetupMode && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600 font-medium">{t('emailLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] bg-white mt-1.5"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('codePlaceholder')}
                      value={setupCode}
                      onChange={(e) => setSetupCode(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] bg-white"
                    />
                    <button
                      onClick={sendSetupCode}
                      disabled={loading === "setup_code" || setupCountdown > 0 || !email}
                      className="px-4 py-3 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 disabled:opacity-50 whitespace-nowrap"
                    >
                      {setupCountdown > 0 ? `${setupCountdown}s` : loading === "setup_code" ? tc('sending') : tc('sendCode')}
                    </button>
                  </div>
                  <div>
                    <PasswordInput
                      value={setupNewPassword}
                      onChange={setSetupNewPassword}
                      placeholder={t('newPasswordPlaceholder')}
                    />
                  </div>
                  <div>
                    <PasswordInput
                      value={setupConfirmPassword}
                      onChange={setSetupConfirmPassword}
                      placeholder={t('confirmPasswordPlaceholder')}
                    />
                  </div>
                  <button
                    onClick={handleSetupPassword}
                    disabled={loading === "setup" || !setupNewPassword || !setupConfirmPassword || !setupCode}
                    className="w-full bg-[#FF6B35] text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 transition-all"
                  >
                    {loading === "setup" ? t('saving') : t('setPassword')}
                  </button>
                  <button
                    onClick={() => { setPasswordSetupMode(false); setError("") }}
                    className="w-full text-xs text-gray-400 hover:text-[#FF6B35] transition-colors"
                  >
                    {t('backToLogin')}
                  </button>
                </div>
              )}

              {/* 分隔线 */}
              {!passwordSetupMode && (
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">{t('socialLogin')}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              )}

              {/* 第三方登录 */}
              {!passwordSetupMode && (
                <div className="space-y-3">
                  <button
                    onClick={() => handleOAuth("alipay")}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0"><rect width="24" height="24" rx="5" fill="#1677FF"/><text x="12" y="17" textAnchor="middle" fill="#fff" fontSize="15" fontFamily="sans-serif" fontWeight="bold">支</text></svg>
                    <span className="font-medium text-gray-700">{t("oauthAlipay")}</span>
                  </button>

                  <div className="mt-3">
                    <button
                      onClick={() => handleOAuth("demo")}
                      disabled={loading !== null}
                      className="w-full bg-gradient-to-r from-[#FF6B35] to-orange-400 text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loading === "demo" ? t('loggingIn') : t('demoVersion')}
                    </button>
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-4">{t("autoRegisterHint")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}