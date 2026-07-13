"use client"
import { signIn, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import PasswordInput from "@/components/ui/PasswordInput"
import OAuthLoadingOverlay from "@/components/ui/OAuthLoadingOverlay"

export default function RegisterClient({ isLoggedIn, userName }: { isLoggedIn?: boolean; userName?: string }) {
  const t = useTranslations('auth')
  const tv = useTranslations('validation')
  const tc = useTranslations('common')
  const [tab, setTab] = useState<"email">("email")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
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

  useEffect(() => {
    const saved = localStorage.getItem("cookmate_code_sent_at")
    if (saved) {
      const elapsed = Math.floor((Date.now() - parseInt(saved)) / 1000)
      const remaining = Math.max(0, 120 - elapsed)
      if (remaining > 0) setCountdown(remaining)
    }
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timerRef.current ?? undefined)
  }, [countdown])

  const sendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      setError(tv('invalidPhone'))
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
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tv('sendFailed'))
        setErrorType('error')
        return
      }
      localStorage.setItem("cookmate_code_sent_at", String(Date.now()))
      setCountdown(120)
      if (data.devCode) {
        setCode(data.devCode)
        setError(`${tv('devCodeAutoFill', { code: data.devCode })}`)
        setErrorType('success')
      } else {
        setError(tv('codeSent'))
        setErrorType('info')
        setTimeout(() => { setError(""); setErrorType('error') }, 3000)
      }
    } catch {
      setError(tv('networkError'))
      setErrorType('error')
    } finally {
      setLoading(null)
    }
  }

  const handlePhoneRegister = async () => {
    if (!phone || !code) {
      setError(tv('emptyPhoneAndCode'))
      setErrorType('error')
      return
    }
    setLoading("phone")
    setError("")
    setErrorType('error')
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tv('verifyFailed'))
        setErrorType('error')
        return
      }
      window.location.href = "/app/dashboard"
    } catch {
      setError(tv('networkError'))
      setErrorType('error')
    } finally {
      setLoading(null)
    }
  }

  const handleEmailRegister = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(tv('invalidEmail'))
      setErrorType('error')
      return
    }
    setLoading("email")
    setError("")
    setErrorType('error')
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tv('sendFailed'))
        setErrorType('error')
        return
      }
      if (data.devCode) {
        setEmailCode(data.devCode)
        setEmailCodeSent(true)
        setError(`${tv('devCodePrefix')} ${data.devCode}`)
        setErrorType('success')
      } else {
        setEmailCodeSent(true)
        setError(tv('codeSentEmail'))
        setErrorType('info')
      }
      localStorage.setItem("cookmate_code_sent_at", String(Date.now()))
      setCountdown(120)
    } catch {
      setError(tv('sendFailedRetry'))
      setErrorType('error')
    } finally {
      setLoading(null)
    }
  }

  const handleEmailVerify = async () => {
    if (!email || !emailCode) {
      setError(tv('emptyEmailAndCode'))
      setErrorType('error')
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
    setLoading("email_login")
    setError("")
    setErrorType('error')
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: emailCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || tv('verifyFailed'))
        setErrorType('error')
        return
      }
      // save password if set
      if (password) {
        await fetch("/api/auth/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        })
      }
      window.location.href = "/app/dashboard"
    } catch {
      setError(tv('networkError'))
      setErrorType('error')
    } finally {
      setLoading(null)
    }
  }

  const handleOAuth = async (provider: string) => {
    setOauthProvider(provider)
    setError("")
    setErrorType('error')
    try {
      await signIn(provider, { callbackUrl: "/app/dashboard" })
    } catch {
      setError(tv('oauthNotConfigured'))
      setErrorType('error')
      setOauthProvider(null)
    }
  }

  return (
    <>
      <OAuthLoadingOverlay provider={oauthProvider} />
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl">🍳</Link>
          <h1 className="text-2xl font-bold text-[#2D3436] mt-2">{t('registerTitle')}</h1>
          <p className="text-gray-500 mt-1">{t('registerSubtitle')}</p>
        </div>

        {isLoggedIn && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-700 font-medium">
              {userName ? `👋 ${userName}` : t('alreadyLoggedIn')}
            </p>
            <p className="text-xs text-blue-500 mt-1">{t('switchAccountForRegister')}</p>
            <div className="mt-3 flex gap-2">
              <Link href="/app/dashboard" className="flex-1 bg-blue-600 text-white text-center text-sm py-2 rounded-lg hover:bg-blue-700">{t('enterDashboard')}</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="flex-1 bg-white text-gray-600 text-center text-sm py-2 rounded-lg border border-gray-200 hover:bg-gray-50">{tc('logout')}</button>
            </div>
          </div>
        )}

        {error && (
          <div className={`mb-4 p-3 rounded-xl text-sm text-center ${
            errorType === 'success' ? "bg-green-50 border border-green-200 text-green-600"
            : errorType === 'info' ? "bg-blue-50 border border-blue-200 text-blue-600"
            : "bg-red-50 border border-red-200 text-red-600"
          }`}>
            {error}
          </div>
        )}

        {/* Email registration */}
        {tab === "email" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 font-medium">{t('emailLabel')}</label>
              <div className="flex gap-2 mt-1.5">
                <input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailCodeSent(false) }}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 bg-white"
                />
                <button
                  onClick={handleEmailRegister}
                  disabled={loading === "email" || countdown > 0 || !email}
                  className="px-4 py-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 whitespace-nowrap transition-colors"
                >
                  {countdown > 0 ? `${countdown}${tc('seconds')}` : loading === "email" ? tc('sending') : tc('sendCode')}
                </button>
              </div>
            </div>
            {emailCodeSent && (
              <div>
                <label className="text-sm text-gray-600 font-medium">{t('codeLabel')}</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder={t('codePlaceholder')}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 bg-white mt-1.5"
                />
              </div>
            )}
            {emailCodeSent && (
              <>
                <div>
                  <label className="text-sm text-gray-600 font-medium">{t('passwordOptionalLabel')}</label>
                  <input
                    type="password"
                    placeholder={t('passwordOptionalPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 bg-white mt-1.5"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium">{t('confirmPasswordLabel')}</label>
                  <input
                    type="password"
                    placeholder={t('confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/20 bg-white mt-1.5"
                  />
                </div>
              </>
            )}
            {emailCodeSent ? (
              <button
                onClick={handleEmailVerify}
                disabled={loading === "email_login" || !emailCode}
                className="w-full bg-[#FF6B35] text-white rounded-xl py-3 font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 transition-all"
              >
                {loading === "email_login" ? t('registering') : t('registerAction')}
              </button>
            ) : (
              <p className="text-xs text-gray-400 text-center">{t('sendCodeHint')}</p>
            )}
          </div>
        )}


        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">{t('socialLogin')}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleOAuth("google")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            <span className="font-medium text-gray-700">Google</span>
          </button>
          <button
            onClick={() => handleOAuth("github")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="#24292F"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            <span className="font-medium text-gray-700">GitHub</span>
          </button>
          <button
            onClick={() => handleOAuth("alipay")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0"><rect width="24" height="24" rx="5" fill="#1677FF"/><text x="12" y="17" textAnchor="middle" fill="#fff" fontSize="15" fontFamily="sans-serif" fontWeight="bold">支</text></svg>
            <span className="font-medium text-gray-700">{t('oauthAlipay')}</span>
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={() => handleOAuth("demo")}
            disabled={loading !== null}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-orange-400 text-white rounded-xl py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading === "demo" ? t('loggingIn') : `🚀 ${t('demoVersion')}`}
          </button>
        </div>

        <div className="mt-6 p-4 bg-orange-50 rounded-xl">
          <p className="text-sm text-[#FF6B35] font-medium">{t('freePlanIncludes')}</p>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li>{t('freePlanAIRecipe')}</li>
            <li>{t('freePlanPantry')}</li>
          </ul>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          {t('hasAccount')}<Link href="/login" className="text-[#FF6B35] hover:underline">{t('loginAction')}</Link>
        </p>
      </div>
    </div>
    </>
  )
}