"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { PricingCard } from "@/components/features/PricingCard"
import { PRICING } from "@cookmate/shared/constants/pricing"
import { cn } from "@cookmate/shared/utils"

interface BillingInfo {
  subscriptionTier: string
  stripeConfigured: boolean
  subscriptionExpiryDate?: string | null
  isDemoUser: boolean
  creemConfigured: boolean
  cancelled: boolean
  todayUsage: number
  orders?: Array<{
    id: string
    orderId: string
    channel: string
    amount: number
    status: string
    createdAt: string
  }>
}

function daysRemaining(expiryStr: string): number {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  const expiry = new Date(expiryStr)
  expiry.setUTCHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / 86400000))
}

export default function BillingPage() {
  const t = useTranslations("billing")
  const locale = useLocale()
  const [info, setInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [paying, setPaying] = useState(false)
  const [topBanner, setTopBanner] = useState("")
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual")

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setInfo({
          subscriptionTier: data.subscriptionTier || "FREE",
          stripeConfigured: !!data.stripeConfigured,
          subscriptionExpiryDate: data.subscriptionExpiryDate,
          isDemoUser: !!data.isDemoUser,
          creemConfigured: !!data.creemConfigured,
          cancelled: !!data.cancelled,
          todayUsage: data.todayUsage ?? 0,
          orders: data.orders || [],
        })
      })
      .catch((err) => { console.error("load billing info error:", err); setError(t("loadingError")); })
      .finally(() => setLoading(false))

    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "true") {
      fetch("/api/creem/create-checkout")
        .then((r) => r.json())
        .then((data) => {
          if (data.checkoutId) {
            return fetch(`/api/creem/create-checkout?checkoutId=${data.checkoutId}`).then((r) => r.json())
          }
          return null
        })
        .then((result) => {
          if (result?.paid || result?.message?.includes("没有待处理")) {
            setRefreshKey((k) => k + 1)
          }
        })
        .catch(() => { /* silent */ })
      window.history.replaceState({}, "", window.location.pathname)
    } else if (params.get("canceled") === "true") {
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [refreshKey])

  const handleCreemUpgrade = async (period: "monthly" | "annual") => {
    setActionLoading("creem")
    setError("")
    try {
      const res = await fetch("/api/creem/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t("createPaymentFailed"))
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error("creem upgrade error:", err)
      setError(t("networkError"))
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">{t("loading")}</div>

  const isFree = info?.subscriptionTier === "FREE"
  const isDemo = info?.isDemoUser
  const currency = locale === "zh-CN" ? "CNY" : "USD"
  const currencySymbol = locale === "zh-CN" ? "¥" : "$"
  const planPrice = PRICING.get(billingPeriod, currency)
  const planPriceDisplay = `${currencySymbol}${planPrice.display}`
  const planPeriodLabel = billingPeriod === "annual"
    ? (locale === "zh-CN" ? "/年" : "/yr")
    : (locale === "zh-CN" ? "/月" : "/mo")

  const daysLeft = info?.subscriptionExpiryDate ? daysRemaining(info.subscriptionExpiryDate) : 0

  return (
    <>
      {topBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white text-center text-sm font-medium py-3 px-4 shadow-lg">
          {topBanner}
        </div>
      )}
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          {message}
        </div>
      )}

      {/* ── Current Plan Card ── */}
      <div className={cn(
        "rounded-2xl border p-6",
        isFree
          ? "bg-white border-gray-100 shadow-sm"
          : info?.cancelled
            ? "bg-white border-gray-100 shadow-sm"
            : "bg-gradient-to-br from-orange-50 to-white border-orange-200 shadow-sm"
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">{t("currentPlan")}</p>
            <h2 className="text-xl font-bold text-gray-900">
              {isFree ? t("currentPlanFree") : t("currentPlanPro")}
            </h2>
            {!isFree && (
              <p className="text-sm text-gray-500">{t("proPlanDesc")}</p>
            )}
            {isFree && (
              <p className="text-sm text-gray-500">{t("freePlanDesc")}</p>
            )}
          </div>
          <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
            isFree
              ? "bg-gray-100 text-gray-600"
              : info?.cancelled
                ? "bg-gray-100 text-gray-500"
                : "bg-orange-50 text-[#FF6B35]"
          )}>
            {isFree ? t("freeBadge") : info?.cancelled ? t("cancelled") : t("proBadge")}
          </span>
        </div>

        {!isFree && info?.subscriptionExpiryDate && !info?.cancelled && (
          <div className="mt-4 flex items-center gap-3">
            <div className={cn(
              "text-sm font-medium px-3 py-1 rounded-full",
              daysLeft <= 7 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
            )}>
              {locale === "zh-CN" ? `剩余 ${daysLeft} 天` : `${daysLeft} days left`}
            </div>
            <span className="text-xs text-gray-400">
              {t("expiryDate", { date: new Date(info.subscriptionExpiryDate).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", { year: "numeric", month: "long", day: "numeric" }) })}
            </span>
          </div>
        )}
        {!isFree && info?.subscriptionExpiryDate && info?.cancelled && (
          <p className="text-xs text-gray-400 mt-2">
            {t("expiryDate", { date: new Date(info.subscriptionExpiryDate).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", { year: "numeric", month: "long", day: "numeric" }) })}
          </p>
        )}

        {/* Pro features quick list */}
        {!isFree && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-gray-600">
              {(t.raw("proPlanFeatures") as string[]).map((f) => (
                <span key={f} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Pricing Section (FREE + PRO active users) ── */}
      {((isFree && !isDemo) || (!isFree && !info?.cancelled)) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-center">
            {isFree ? t("selectPlan") : t("extendTitle")}
          </h3>

          {/* Period toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={cn(
                  "px-5 py-1.5 rounded-full text-sm font-medium transition-all",
                  billingPeriod === "monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {t("monthly")}
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={cn(
                  "px-5 py-1.5 rounded-full text-sm font-medium transition-all",
                  billingPeriod === "annual"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {t("annual")}
              </button>
            </div>
            {billingPeriod === "annual" && (
              <span className="ml-3 text-xs text-green-600 font-medium self-center bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                {t("yearlySaving")}
              </span>
            )}
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Free card */}
            <PricingCard
              name="Free"
              price="0"
              periodLabel=""
              period={t("freeTier")}
              features={t.raw("freePlanFeatures") as string[]}
              highlighted={false}
              isCurrent={isFree}
              ctaLabel={isFree ? t("inUse") : t("downgradeLabel")}
              onCta={() => { if (!isFree) setShowDowngradeModal(true) }}
              disabled={isFree}
              loading={false}
            />

            {/* Pro card */}
            <PricingCard
              name={t("proPlan")}
              price={planPrice.display}
              periodLabel={planPeriodLabel}
              period={billingPeriod === "annual" ? t("yearlyPeriod") : t("monthlyPeriod")}
              saving={billingPeriod === "annual" ? t("yearlySaving") : undefined}
              features={t.raw("proPlanFeatures") as string[]}
              highlighted={true}
              isCurrent={!isFree}
              ctaLabel={isFree ? t("upgradeAction") : t("extendAction")}
              onCta={() => setShowCheckoutModal(true)}
              disabled={false}
              loading={false}
            />
          </div>
        </div>
      )}

      {/* ── Demo User Section ── */}
      {isFree && isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-lg mb-2">{t("demoBillingTitle")}</p>
          <p className="text-sm text-amber-700 mb-4">
            {t("demoBillingDesc")}
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#FF6B35] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 transition-all"
          >
            {t("demoBillingRegister")}
          </Link>
        </div>
      )}

      {/* ── PRO: Manage Subscription (cancel) ── */}
      {!isFree && !info?.cancelled && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{t("subscriptionManage")}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{t("subscriptionManageDesc")}</p>
          </div>
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={actionLoading !== null}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 text-xs text-red-500 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {actionLoading === "cancel" ? t("cancelling") : t("cancelSubscription")}
          </button>
        </div>
      )}

      {/* ── PRO Cancelled ── */}
      {!isFree && info?.cancelled && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{t("subscriptionManage")}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{t("subscriptionManageDesc")}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1.5">
              {t("subscriptionCancelled")}
            </span>
          </div>
        </div>
      )}

      {/* ── Order History Link ── */}
      {(info?.orders?.length ?? 0) > 0 && (
        <div className="text-center">
          <Link
            href="/app/orders"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#FF6B35] transition-colors"
          >
            {t("orderHistory")}
          </Link>
        </div>
      )}

      {/* ── Checkout Modal ── */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setShowCheckoutModal(false); setError("") }}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 mb-4 text-center">
              {isFree ? t("checkoutTitle") : t("extendTitle")}
            </h3>

            <div className="bg-gradient-to-r from-[#FF6B35] to-orange-500 rounded-xl p-4 text-white mb-4 text-center">
              <p className="text-sm text-white/80">{t("proPlan")}</p>
              <p className="text-2xl font-bold mt-1">{planPriceDisplay}{planPeriodLabel}</p>
              <p className="text-xs text-white/70 mt-1">
                {billingPeriod === "annual" ? t("yearlyPeriod") : t("monthlyPeriod")}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            <p className="text-sm font-medium text-gray-700 mb-3">{t("paymentMethods")}</p>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  setPaying(true)
                  setError("")
                  try {
                    const res = await fetch("/api/alipay/create", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ period: billingPeriod }),
                    })
                    const data = await res.json()
                    if (data.payUrl) {
                      window.location.href = data.payUrl
                    } else {
                      setError(data.error || t("createPaymentFailed"))
                      setPaying(false)
                    }
                  } catch {
                    setError(t("networkError"))
                    setPaying(false)
                  }
                }}
                disabled={actionLoading !== null || paying}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-40 group"
              >
                <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="#1677FF"/>
                  <path d="M19.695 15.07c3.426 1.158 4.203 1.22 4.203 1.22V3.846c0-2.124-1.705-3.845-3.81-3.845H3.914C1.808.001.102 1.722.102 3.846v16.31c0 2.123 1.706 3.845 3.813 3.845h16.173c2.105 0 3.81-1.722 3.81-3.845v-.157s-6.19-2.602-9.315-4.119c-2.096 2.602-4.8 4.181-7.607 4.181-4.75 0-6.361-4.19-4.112-6.949.49-.602 1.324-1.175 2.617-1.497 2.025-.502 5.247.313 8.266 1.317a16.796 16.796 0 0 0 1.341-3.302H5.781v-.952h4.799V6.975H4.77v-.953h5.81V3.591s0-.409.411-.409h2.347v2.84h5.744v.951h-5.744v1.704h4.69a19.453 19.453 0 0 1-1.986 5.06c1.424.52 2.702 1.011 3.654 1.333m-13.81-2.032c-.596.06-1.71.325-2.321.869-1.83 1.608-.735 4.55 2.968 4.55 2.151 0 4.301-1.388 5.99-3.61-2.403-1.182-4.438-2.028-6.637-1.809" fill="white"/>
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{t("alipay")}</p>
                  <p className="text-xs text-gray-400">{planPriceDisplay}{planPeriodLabel}</p>
                </div>
                {paying && <span className="text-xs text-gray-400 shrink-0">{t("redirecting")}</span>}
              </button>

              {info?.creemConfigured && (
                <button
                  onClick={() => handleCreemUpgrade(billingPeriod)}
                  disabled={actionLoading !== null}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-green-400 hover:bg-green-50/50 transition-all disabled:opacity-40 group"
                >
                  <svg className="w-7 h-7 shrink-0" viewBox="0 0 121 121" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="121" height="121" rx="16" fill="#151617"/>
                    <path d="M22.1102 11C24.1187 11.0001 25.9669 12.0982 26.9281 13.8619L51.2059 58.4106C52.5699 60.9134 55.7048 61.8368 58.2077 60.473C60.7108 59.109 61.6342 55.9742 60.2701 53.4712L41.5466 19.113C39.554 15.4566 42.2004 11 46.3645 11H103.806C107.885 11 110.539 15.2933 108.715 18.9416L65.0579 106.254C63.0356 110.298 57.2654 110.298 55.2431 106.254L11.5863 18.9416C9.76212 15.2933 12.4156 11 15.4946 11H22.1102Z" fill="white"/>
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{t("creem")}</p>
                    <p className="text-xs text-gray-400">{t("creemDesc")}</p>
                  </div>
                  {actionLoading === "creem" && <span className="text-xs text-gray-400 shrink-0">{t("redirecting")}</span>}
                </button>
              )}
            </div>

            <button
              onClick={() => { setShowCheckoutModal(false); setError("") }}
              className="w-full mt-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t("checkoutCancel")}
            </button>
          </div>
        </div>
      )}

      {/* ── Cancel Confirmation Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900">{t("cancelSubscription")}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">{t("cancelConfirm")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {locale === "en" ? "Keep Pro" : "保留 Pro"}
              </button>
              <button
                onClick={async () => {
                  setShowCancelModal(false)
                  setActionLoading("cancel")
                  try {
                    const res = await fetch("/api/subscription/cancel", { method: "POST" })
                    const data = await res.json()
                    if (data.success) {
                      setTopBanner(data.message)
                      setTimeout(() => setTopBanner(""), 5000)
                      setRefreshKey((k) => k + 1)
                    } else {
                      setError(data.error || t("cancelFailed"))
                    }
                  } catch {
                    setError(t("networkError"))
                  } finally {
                    setActionLoading(null)
                  }
                }}
                disabled={actionLoading === "cancel"}
                className="flex-1 px-4 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:bg-gray-300 transition-colors font-medium"
              >
                {actionLoading === "cancel" ? t("cancelling") : t("cancelSubscription")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Downgrade Confirmation Modal (PRO → Free) ── */}
      {showDowngradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDowngradeModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-900">{t("cancelSubscription")}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">{t("cancelConfirm")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDowngradeModal(false)}
                className="flex-1 px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {locale === "en" ? "Keep Pro" : "保留 Pro"}
              </button>
              <button
                onClick={async () => {
                  setShowDowngradeModal(false)
                  setActionLoading("cancel")
                  try {
                    const res = await fetch("/api/subscription/cancel", { method: "POST" })
                    const data = await res.json()
                    if (data.success) {
                      setTopBanner(data.message)
                      setTimeout(() => setTopBanner(""), 5000)
                      setRefreshKey((k) => k + 1)
                    } else {
                      setError(data.error || t("cancelFailed"))
                    }
                  } catch {
                    setError(t("networkError"))
                  } finally {
                    setActionLoading(null)
                  }
                }}
                disabled={actionLoading === "cancel"}
                className="flex-1 px-4 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:bg-gray-300 transition-colors font-medium"
              >
                {locale === "en" ? "Downgrade" : "降级到免费版"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}