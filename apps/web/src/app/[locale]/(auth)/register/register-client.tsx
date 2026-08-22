"use client"
import { signIn, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import OAuthLoadingOverlay from "@/components/ui/OAuthLoadingOverlay"
import { useRouter } from "@/i18n/navigation"

export default function RegisterClient({ isLoggedIn, userName }: { isLoggedIn?: boolean; userName?: string }) {
  const t = useTranslations('auth')
  const router = useRouter()
  const tv = useTranslations('validation')
  const tc = useTranslations('common')
  const [email, setEmail] = useState("")
  const [emailCode, setEmailCode] = useState("")
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [errorType, setErrorType] = useState<'success' | 'info' | 'error'>('error')
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [oauthProvider, setOauthProvider] = useState<string | null>(null)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [termsError, setTermsError] = useState("")
  const [shaking, setShaking] = useState(false)

  // 已登录用户直接跳转（解决已打开页面不触发服务端 redirect 的问题）
  useEffect(() => {
    if (isLoggedIn) {
      router?.push("/app/dashboard")
    }
  }, [isLoggedIn, router])

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timerRef.current ?? undefined)
  }, [countdown])

  useEffect(() => {
    if (shaking) {
      const t = setTimeout(() => setShaking(false), 400)
      return () => clearTimeout(t)
    }
  }, [shaking])

  const sendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(tv('invalidEmail'))
      setErrorType('error')
      return
    }
    setLoading("send")
    setError("")
    setErrorType('error')
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "register" }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          setError(t('emailRegistered'))
        } else {
          setError(data.error || tv('sendFailed'))
        }
        setErrorType('error')
        return
      }
      setEmailCodeSent(true)
      setCountdown(120)
      if (data.devCode) {
        setEmailCode(data.devCode)
        setError(`${tv('devCodePrefix')} ${data.devCode}`)
        setErrorType('success')
      } else {
        setError(tv('codeSentEmail'))
        setErrorType('info')
      }
    } catch {
      setError(tv('networkError'))
      setErrorType('error')
    } finally {
      setLoading(null)
    }
  }

  const handleEmailRegister = async () => {
    if (!email || !emailCode) {
      setError(tv('emptyEmailAndCode'))
      setErrorType('error')
      return
    }
    if (!agreeTerms) {
      setShaking(true)
      setTermsError(tv('agreeTermsRequired'))
      return
    }
    if (password && password !== confirmPassword) {
      setError(tv('passwordMismatch'))
      setErrorType('error')
      return
    }
    if (password && password.length < 8) {
      setError(tv('passwordTooShort'))
      setErrorType('error')
      return
    }
    setLoading("email")
    setError("")
    setErrorType('error')
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: emailCode, agreeTerms: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tv('verifyFailed'))
        setErrorType('error')
        return
      }
      if (password) {
        await fetch("/api/auth/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        })
      }
      router?.push("/app/dashboard")
    } catch {
      setError(tv('networkError'))
      setErrorType('error')
    } finally {
      setLoading(null)
    }
  }

  const handleOAuth = async (provider: string) => {
      if (provider !== "demo" && !agreeTerms) {
        setShaking(true)
        setTermsError(tv('agreeTermsRequired'))
        return
      }
      setTermsError("")
      setOauthProvider(provider)
    setError("")
    setErrorType('error')
    try {
      if (isLoggedIn) {
        await signOut({ redirect: false })
      }
      const result = await signIn(provider, { redirect: false, callbackUrl: "/app/dashboard" })
      if (result?.error) {
        setError(result.error === "OAuthSignin" ? tv('oauthNotConfigured') : result.error)
        setErrorType('error')
        setOauthProvider(null)
        return
      }
      if (result?.url) {
        // OAuth 授权后是外部跳转地址（如 accounts.google.com），必须用 window.location 跳转
        window.location.href = result.url
      }
    } catch {
      setError(tv('oauthNotConfigured'))
      setErrorType('error')
      setOauthProvider(null)
    }
  }

  const handleDemoLogin = async () => {
    setLoading("demo")
    setError("")
    setErrorType('error')
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
      router?.push("/app/dashboard")
    } catch {
      setError(tv('oauthNotConfigured'))
      setErrorType('error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <OAuthLoadingOverlay provider={oauthProvider} />
      <style>{`@keyframes shakeX{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`}</style>
      <div className="min-h-screen bg-gradient-to-br from-bg-brand to-[#FFE8D6] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full ring-1 ring-orange-100/50">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl">🍳</Link>
          <h1 className="text-2xl font-bold text-text-primary mt-2">{t('registerTitle')}</h1>
          <p className="text-text-secondary mt-1">{t('registerSubtitle')}</p>
        </div>

        {isLoggedIn && (
          <div className="mb-4 p-4 bg-info/10 border border-info/25 rounded-xl">
            <p className="text-sm text-info font-medium">
              {userName ? `👋 ${userName}` : t('alreadyLoggedIn')}
            </p>
            <p className="text-xs text-info/70 mt-1">{t('switchAccountForRegister')}</p>
            <div className="mt-3 flex gap-2">
              <Link href="/app/dashboard" className="flex-1 bg-info text-white text-center text-sm py-2 rounded-lg hover:bg-info/90">{t('enterDashboard')}</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="flex-1 bg-card text-text-secondary text-center text-sm py-2 rounded-lg border border-border hover:bg-surface">{tc('logout')}</button>
            </div>
          </div>
        )}

        {error && (
          <div className={`mb-4 p-3 rounded-xl text-sm text-center ${
            errorType === 'success' ? "bg-success/10 border border-success/25 text-success"
            : errorType === 'info' ? "bg-info/10 border border-info/25 text-info"
            : "bg-error/10 border border-error/25 text-error"
          }`}>
            {error}
          </div>
        )}

        {/* Email registration */}
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
                onClick={sendCode}
                disabled={loading === "send" || countdown > 0 || !email}
                className="px-4 py-3 rounded-xl text-sm font-medium bg-surface text-text-secondary hover:bg-border disabled:opacity-40 whitespace-nowrap transition-colors"
              >
                {countdown > 0 ? `${countdown}${tc('seconds')}` : loading === "send" ? tc('sending') : tc('sendCode')}
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
              <div>
                <label className="text-sm text-text-secondary font-medium">{t('passwordOptionalLabel')}</label>
                <input
                  type="password"
                  placeholder={t('passwordOptionalPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 bg-card mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary font-medium">{t('confirmPasswordLabel')}</label>
                <input
                  type="password"
                  placeholder={t('confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 bg-card mt-1.5"
                />
              </div>
            </>
          )}
          {emailCodeSent && (
            <button
              onClick={handleEmailRegister}
              disabled={loading === "email" || !emailCode}
              className="w-full bg-accent text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-text-secondary transition-all"
            >
              {loading === "email" ? t('registering') : t('registerAction')}
            </button>
          )}
          {!emailCodeSent && (
            <p className="text-xs text-text-secondary text-center">{t('sendCodeHint')}</p>
          )}
        </div>

        {/* Terms checkbox */}
        <div className="mt-4">
          <div className={shaking ? 'animate-shake' : ''} style={{ animation: shaking ? 'shakeX 0.4s ease-in-out' : undefined }}>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => { setAgreeTerms(e.target.checked); if (e.target.checked) setTermsError("") }}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
              />
              <span className="text-xs text-text-secondary leading-relaxed">
                {t.rich('agreeTerms', {
                  terms: (chunks) => <Link href="/terms" className="text-accent hover:underline" target="_blank">{chunks}</Link>,
                  privacy: (chunks) => <Link href="/privacy" className="text-accent hover:underline" target="_blank">{chunks}</Link>,
                })}
              </span>
            </label>
          </div>
          {termsError && (
            <p className="text-xs text-error mt-1 ml-6">{termsError}</p>
          )}
        </div>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-text-secondary">{t('socialRegister')}</span>
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
            {loading === "demo" ? t('loggingIn') : `🚀 ${t('demoVersion')}`}
          </button>
        </div>

        <div className="mt-6 p-4 bg-surface rounded-xl">
          <p className="text-sm text-accent font-medium">{t('freePlanIncludes')}</p>
          <ul className="mt-2 text-sm text-text-secondary space-y-1">
            <li>{t('freePlanAIRecipe')}</li>
            <li>{t('freePlanPantry')}</li>
          </ul>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          {t('hasAccount')}<Link href="/login" className="text-accent hover:underline">{t('loginAction')}</Link>
        </p>
      </div>
    </div>
    </>
  )
}