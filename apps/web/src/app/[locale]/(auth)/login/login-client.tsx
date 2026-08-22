"use client"

import { signIn, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import PasswordInput from "@/components/ui/PasswordInput"
import Link from "next/link"
import OAuthLoadingOverlay from "@/components/ui/OAuthLoadingOverlay"
import { useTranslations, useLocale } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"

export default function LoginClient({ isLoggedIn, userName }: { isLoggedIn?: boolean; userName?: string }) {
  const t = useTranslations('auth')
  const tv = useTranslations('validation')
  const tc = useTranslations('common')
  const te = useTranslations('errors')
  const [tab, setTab] = useState<"email" | "password">("email")
  const [email, setEmail] = useState("")
  const [emailCode, setEmailCode] = useState("")
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const [oauthProvider, setOauthProvider] = useState<string | null>(null)

  // OAuth 回调失败（如邮箱已绑定其他账号）回跳时读取 ?error= 展示提示横幅
  // 用 useSearchParams 在惰性初始化里读参数，避免 useEffect 内同步 setState 触发 lint 规则
  const searchParams = useSearchParams()
  const [oauthError] = useState<string | null>(() => searchParams.get("error"))
  const [oauthBannerDismissed, setOauthBannerDismissed] = useState(false)
  const locale = useLocale()
  // 仅未登录时展示；关闭后用 history.replaceState 清掉 URL 上的 ?error=，避免刷新重现
  const showOauthError = !!oauthError && !oauthBannerDismissed && !isLoggedIn
  const dismissOauthError = () => {
    setOauthBannerDismissed(true)
    const params = new URLSearchParams(window.location.search)
    params.delete("error")
    const qs = params.toString()
    window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`)
  }
  const OAUTH_ERROR_KEYS: Record<string, string> = {
    AccessDenied: "oauthAccessDenied",
    Configuration: "oauthConfigError",
  }

  // 密码设置模式（在密码登录 tab 中设密码）
  const [passwordSetupMode, setPasswordSetupMode] = useState(false)
  const [setupCode, setSetupCode] = useState("")
  const [setupNewPassword, setSetupNewPassword] = useState("")
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("")
  const [, setSetupCodeSent] = useState(false)
  const [setupCountdown, setSetupCountdown] = useState(0)
  const [emailMsg, setEmailMsg] = useState("")

  // 已登录用户直接跳转（解决已打开页面不触发服务端 redirect 的问题）
  useEffect(() => {
    if (isLoggedIn) {
      router?.push("/app/dashboard")
    }
  }, [isLoggedIn, router])

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

  const handleEmailLogin = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(tv('invalidEmail'))
      return
    }
    setLoading("email")
    setError("")
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "login" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tv('sendFailed'))
        // 429 = 2分钟内已有验证码
        if (res.status === 429) {
          setEmailCodeSent(true)
          if (data.remainingSeconds) setCountdown(data.remainingSeconds)
          if (data.devCode) setEmailCode(data.devCode)
        }
        // 404 = 邮箱未注册
        if (res.status === 404) {
          // 显示错误提示，不切换状态
        }
        return
      }
      setEmailCodeSent(true)
      setCountdown(120)
      if (data.devCode) {
        setEmailCode(data.devCode)
        setEmailMsg(tv('devCodePrefix') + ' ' + data.devCode)
      } else {
        setEmailMsg(tv('codeSentEmail'))
      }
    } catch {
      setError(tv('sendFailedRetry'))
    } finally {
      setLoading(null)
    }
  }

  const handleEmailVerify = async () => {
    if (!email || !emailCode) {
      setError(tv('emptyEmailAndCode'))
      return
    }
    setLoading("email_login")
    setError("")
    try {
      if (isLoggedIn) await signOut({ redirect: false })
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: emailCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tv('verifyFailed'))
        return
      }
      router?.push("/app/dashboard")
    } catch {
      setError(tv('networkError'))
    } finally {
      setLoading(null)
    }
  }

  const handlePasswordLogin = async () => {
    if (!email || (!/^1\d{10}$/.test(email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setError(tv('invalidAccount'))
      return
    }
    if (!password) {
      setError(tv('emptyPassword'))
      return
    }
    if (password.length < 8) {
      setError(tv('passwordTooShort'))
      return
    }
    setLoading("password")
    setError("")
    try {
      if (isLoggedIn) await signOut({ redirect: false })
      // 先检查账号是否设置了密码
      const checkRes = await fetch("/api/auth/check-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: email }),
      })
      const checkData = await checkRes.json()
      if (!checkData.userExists) {
        setError(tv('accountNotFound'))
        setLoading(null)
        return
      }
      if (!checkData.hasPassword) {
        setPasswordSetupMode(true)
        setError(tv('noPasswordSet'))
        setLoading(null)
        return
      }

      // 检查是否被锁定
      const lockRes = await fetch(`/api/auth/check-lockout?account=${encodeURIComponent(email)}`)
      const lockData = await lockRes.json()
      if (lockData.locked) {
        setError(te('accountLocked').replace('{minutes}', String(lockData.minutesRemaining)))
        setLoading(null)
        return
      }

      const result = await signIn("password", {
        account: email,
        password,
        redirect: false,
      })
      if (result?.error) {
        // 检查剩余次数
        try {
          const remainRes = await fetch(`/api/auth/check-lockout?account=${encodeURIComponent(email)}`)
          const remainData = await remainRes.json()
          if (remainData.locked) {
            setError(te('accountLocked').replace('{minutes}', String(remainData.minutesRemaining)))
          } else if (remainData.remaining < 3) {
            setError(`${tv('wrongPassword')} ${te('attemptsRemaining').replace('{count}', String(remainData.remaining))}`)
          } else {
            setError(tv('wrongPassword'))
          }
        } catch {
          setError(tv('wrongPassword'))
        }
      } else {
        router?.push(result?.url || "/app/dashboard")
      }
    } catch {
      setError(tv('wrongPassword'))
    } finally {
      setLoading(null)
    }
  }

  const sendSetupCode = async () => {
      setLoading("setup_code")
      setError("")
      try {
        const body = { email }
        const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tv('sendFailed'))
        return
      }
      setSetupCodeSent(true)
      setSetupCountdown(120)
      if (data.devCode) {
        setSetupCode(data.devCode)
        setError(tv('devCodePrefix') + ' ' + data.devCode)
      } else {
        setError(tv('codeSentTo', { target: tv('email') }))
        setTimeout(() => setError(""), 3000)
      }
    } catch {
      setError(tv('sendFailed'))
    } finally {
      setLoading(null)
    }
  }

  const handleSetupPassword = async () => {
    if (!setupCode) {
      setError(tv('emptyCode'))
      return
    }
    if (setupNewPassword.length < 8) {
      setError(tv('passwordTooShort'))
      return
    }
    if (setupNewPassword !== setupConfirmPassword) {
      setError(tv('passwordMismatch'))
      return
    }
    setLoading("setup_submit")
    setError("")
    try {
      const isPhone = /^1\d{10}$/.test(email)

      // 设置密码（set-password 会自己验证验证码）
      const body = isPhone
        ? { phone: email, password: setupNewPassword, code: setupCode }
        : { email, password: setupNewPassword, code: setupCode }
      const setRes = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!setRes.ok) {
        const setData = await setRes.json()
        setError(setData.error || tv('setPasswordFailed'))
        return
      }

      // 设置成功，用密码登录
      await signIn("password", {
        account: email,
        password: setupNewPassword,
        callbackUrl: "/app/dashboard",
      })
    } catch {
      setError(tv('setupFailed'))
    } finally {
      setLoading(null)
    }
  }

  const handleOAuth = async (provider: string) => {
    setOauthProvider(provider)
    setError("")
    try {
      if (isLoggedIn) {
        await signOut({ redirect: false })
      }
      const result = await signIn(provider, { redirect: false, callbackUrl: "/app/dashboard" })
      if (result?.error) {
        setError(result.error === "OAuthSignin" ? tv('oauthNotConfigured') : result.error)
        setOauthProvider(null)
        return
      }
      // 无错误才跳转
      if (result?.url) {
        window.location.href = result.url
      }
    } catch {
      setError(tv('oauthNotConfigured'))
      setOauthProvider(null)
    }
  }

  const handleDemoLogin = async () => {
    setLoading("demo")
    setError("")
    try {
      // 先退出当前登录（不管 isLoggedIn 是否准确，都清理 session）
      await signOut({ redirect: false })
      // 再设置 demo cookie
      const res = await fetch("/api/auth/demo-login", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tv('oauthNotConfigured'))
        return
      }
      // 刷新 session 后跳转
      router?.push("/app/dashboard")
    } catch {
      setError(tv('oauthNotConfigured'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <OAuthLoadingOverlay provider={oauthProvider} />
      <div className="min-h-screen bg-gradient-to-br from-bg-brand to-[#FFE8D6] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full ring-1 ring-orange-100/50">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl hover:scale-105 transition-transform inline-block">🍳</Link>
          <h1 className="text-2xl font-bold text-text-primary mt-2">{t('loginTitle')}</h1>
          <p className="text-text-secondary mt-1">{t('loginSubtitle')}</p>
        </div>

        {isLoggedIn && (
          <div className="mb-4 p-4 bg-info/10 border border-info/25 rounded-xl">
            <p className="text-sm text-info font-medium">
              {userName ? `👋 ${userName}` : t('alreadyLoggedIn')}
            </p>
            <p className="text-xs text-info/70 mt-1">{t('switchAccount')}</p>
            <div className="mt-3 flex gap-2">
              <Link href="/app/dashboard" className="flex-1 bg-info text-white text-center text-sm py-2 rounded-lg hover:bg-info/90">{t('enterDashboard')}</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="flex-1 bg-card text-text-secondary text-center text-sm py-2 rounded-lg border border-border hover:bg-surface">{tc('logout')}</button>
            </div>
          </div>
        )}

        {/* OAuth 错误提示横幅：邮箱已绑定其他账号 / 取消授权 / 配置异常 */}
        {showOauthError && (
          <div className="relative mb-6 p-3 pr-8 rounded-xl bg-error/10 border border-error/25 text-xs text-error leading-relaxed">
            <button
              type="button"
              onClick={dismissOauthError}
              aria-label={tc('close')}
              className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-error/60 hover:text-error hover:bg-error/10 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {oauthError === 'OAuthAccountNotLinked' ? (
              <p>
                {t.rich('oauthAccountNotLinked', {
                  link: (chunks) => (
                    <Link href={`/${locale}/login?callbackUrl=/${locale}/app/settings`} className="text-accent font-medium hover:underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            ) : (
              <p>{t((oauthError && OAUTH_ERROR_KEYS[oauthError]) || 'oauthErrorGeneric')}</p>
            )}
          </div>
        )}

        {/* 登录方式切换标签 */}
        <div className="flex mb-6 bg-surface rounded-xl p-1">
          <button
            onClick={() => setTab("email")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === "email" ? "bg-card text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t('tabEmail')}
          </button>
          <button
            onClick={() => setTab("password")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              tab === "password" ? "bg-card text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t('tabPassword')}
          </button>
        </div>

        {/* 邮箱登录 */}
        {tab === "email" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary font-medium">{t('emailLabel')}</label>
              <div className="flex gap-2 mt-1.5">
                <input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailCodeSent(false) }}
                  className="flex-1 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 bg-card"
                />
                <button
                  onClick={handleEmailLogin}
                  disabled={loading === "email" || countdown > 0 || !email}
                  className="px-4 py-3 rounded-xl text-sm font-medium bg-surface text-text-secondary hover:bg-border disabled:opacity-40 whitespace-nowrap transition-colors"
                >
                  {countdown > 0 ? `${countdown}${tc('seconds')}` : loading === "email" ? tc('sending') : tc('sendCode')}
                </button>
              </div>
            </div>
            {emailCodeSent && (
              <>
                <div>
                  <label className="text-sm text-text-secondary font-medium">{t('codeLabel')}</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder={t('codePlaceholder')}
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 bg-card mt-1.5"
                  />
                </div>
                <button
                  onClick={handleEmailVerify}
                  disabled={loading === "email_login" || !emailCode}
                  className="w-full bg-accent text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-text-secondary transition-all active:scale-[0.98]"
                >
                  {loading === "email_login" ? t('loggingIn') : t('loginRegisterAction')}
                </button>
                {emailMsg && (
                  <div className="text-xs text-success bg-success/10 border border-success/25 rounded-xl px-3 py-2">
                    {emailMsg}
                  </div>
                )}
                {error && tab === "email" && (
                  <div className={`text-xs rounded-xl px-3 py-2 ${
                    error.includes("dev") ? "bg-success/10 border border-success/25 text-success"
                    : error.includes("sent") ? "bg-info/10 border border-info/25 text-info"
                    : "bg-error/10 border border-error/25 text-error"
                  }`}>
                    {error}
                  </div>
                )}
              </>
            )}
            {!emailCodeSent && error && tab === "email" && (
              <div className="text-xs rounded-xl px-3 py-2 bg-error/10 border border-error/25 text-error">
                {error}
              </div>
            )}
            {!emailCodeSent && (
              <p className="text-xs text-text-secondary text-center">{t('sendCodeHint')}</p>
            )}
          </div>
        )}

        {/* 密码登录 */}        {tab === "password" && !passwordSetupMode && (          <div className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary font-medium">{t('accountLabel')}</label>
              <input
                type="text"
                placeholder={t('accountPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 bg-card mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary font-medium">{t('passwordLabel')}</label>
              <PasswordInput
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={setPassword}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 bg-card mt-1.5"
              />
            </div>            <button
              onClick={handlePasswordLogin}
              disabled={loading === "password" || !email || !password}
              className="w-full bg-accent text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-text-secondary transition-all active:scale-[0.98]"
            >
              {loading === "password" ? t('loggingIn') : t('loginAction')}
            </button>
            <button
              onClick={() => { setPasswordSetupMode(true); setError(""); setPassword(""); setSetupNewPassword(""); setSetupConfirmPassword(""); setSetupCode(""); setSetupCodeSent(false) }}
              className="w-full text-xs text-text-secondary hover:text-accent transition-colors"
            >
              {t('forgotPassword')}
            </button>          </div>        )}

        {/* 密码设置模式（没设密码时直接设） */}
        {tab === "password" && passwordSetupMode && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary font-medium">{t('emailLabel')}</label>
              <input
                type="text"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent bg-card mt-1.5"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('codePlaceholder')}
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ""))}
                className="flex-1 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent bg-card"
                maxLength={6}
              />
              <button
                onClick={sendSetupCode}
                disabled={loading === "setup_code" || setupCountdown > 0}
                className="px-4 py-3 rounded-xl text-sm font-medium bg-surface text-text-secondary hover:bg-border disabled:opacity-40 whitespace-nowrap"
              >
                {setupCountdown > 0 ? `${setupCountdown}${tc('seconds')}` : loading === "setup_code" ? tc('sending') : tc('sendCode')}
              </button>
            </div>
            <div>
              <label className="text-sm text-text-secondary font-medium">{t('passwordLabel')}</label>
              <PasswordInput
                placeholder={t('passwordPlaceholderSetup')}
                value={setupNewPassword}
                onChange={setSetupNewPassword}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent bg-card mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary font-medium">{t('confirmPasswordLabel')}</label>
              <PasswordInput
                placeholder={t('confirmPasswordPlaceholder')}
                value={setupConfirmPassword}
                onChange={setSetupConfirmPassword}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent bg-card mt-1.5"
              />
            </div>
            <button
              onClick={handleSetupPassword}
              disabled={loading === "setup_submit" || !setupCode || !setupNewPassword || !setupConfirmPassword}
              className="w-full bg-accent text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-text-secondary transition-all active:scale-[0.98]"
            >
              {loading === "setup_submit" ? t('loggingIn') : t('setupPassword')}
            </button>
            <button
              onClick={() => { setPasswordSetupMode(false); setError(""); setSetupCodeSent(false) }}
              className="w-full text-sm text-text-secondary hover:text-text-secondary transition-colors"
            >
              {t('backToLogin')}
            </button>
          </div>
        )}

        {/* 非邮箱 tab 的错误提示 */}
        {error && tab !== "email" && (
          <div className={`mt-2 p-3 rounded-xl text-sm text-center ${
            error.includes("dev") ? "bg-success/10 border border-success/25 text-success"
            : "bg-error/10 border border-error/25 text-error"
          }`}>
            {error}
          </div>
        )}

        {tab === "email" && (<>
        {/* 社交账号登录 */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-text-secondary">{t('socialLogin')}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleOAuth("google")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-1.5 border border-border rounded-xl py-2.5 hover:bg-surface transition-colors disabled:opacity-50 text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            <span className="font-medium text-text-primary">Google</span>
          </button>
          <button
            onClick={() => handleOAuth("github")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-1.5 border border-border rounded-xl py-2.5 hover:bg-surface transition-colors disabled:opacity-50 text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="#24292F"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            <span className="font-medium text-text-primary">GitHub</span>
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={handleDemoLogin}
            disabled={loading !== null}
            className="w-full bg-gradient-to-r from-accent to-orange-400 text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading === "demo" ? t('loggingIn') : t('demoVersion')}
          </button>
        </div>
        </>)}

        <p className="text-center text-xs text-text-secondary mt-4">
          {t.rich('continueOAuth', {
            terms: (chunks) => <Link href="/terms" className="text-accent hover:underline" target="_blank">{chunks}</Link>,
            privacy: (chunks) => <Link href="/privacy" className="text-accent hover:underline" target="_blank">{chunks}</Link>,
          })}
        </p>
        <p className="text-center text-sm text-text-secondary mt-2">
          {t('noAccount')}<Link href="/register" className="text-accent hover:underline ml-1">{t('registerAction')}</Link>
        </p>
      </div>
    </div>
    </>
  )
}