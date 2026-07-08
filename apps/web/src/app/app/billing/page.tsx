"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { PricingCard } from "@/components/features/PricingCard"

interface BillingInfo {
  subscriptionTier: string
  stripeConfigured: boolean
  subscriptionExpiryDate?: string | null
  isDemoUser: boolean
  creemConfigured: boolean
  orders?: Array<{
    id: string
    orderId: string
    channel: string
    amount: number
    status: string
    createdAt: string
  }>
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

  const handlePaymentSuccess = () => {
    setRefreshKey((k) => k + 1)
    setMessage(t("paymentSuccess"))
  }

  const handleStripeUpgrade = async (tier: string) => {
    setActionLoading(tier)
    setError("")
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t("createCheckoutFailed"))
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error("stripe upgrade error:", err)
      setError(t("networkError"))
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreemUpgrade = async () => {
    setActionLoading("creem")
    setError("")
    try {
      const res = await fetch("/api/creem/create-checkout", { method: "POST" })
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

  const handleManageSubscription = async () => {
    setActionLoading("manage")
    setError("")
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t("createManageFailed"))
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error("manage subscription error:", err)
      setError(t("networkError"))
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">{t("loading")}</div>

  const isFree = info?.subscriptionTier === "FREE"
  const hasAnyPayment = info?.stripeConfigured

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t("currentPlan")}</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              {isFree ? t("currentPlanFree") : t("currentPlanPro")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isFree ? t("freePlanDesc") : t("proPlanDesc")}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              isFree
                ? "bg-gray-100 text-gray-600"
                : "bg-orange-50 text-[#FF6B35]"
            }`}
          >
            {isFree ? t("freeBadge") : t("proBadge")}
          </span>
        </div>
        {!isFree && info?.subscriptionExpiryDate && (
          <p className="text-xs text-gray-400 mt-2">
            {t("expiryDate", { date: new Date(info.subscriptionExpiryDate).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", { year: "numeric", month: "long", day: "numeric" }) })}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">{t("selectPlan")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <PricingCard
            name="Free"
            price="0"
            periodLabel=""
            period={t("freeTier")}
            features={t.raw("freePlanFeatures") as string[]}
            highlighted={false}
            isCurrent={isFree}
            ctaLabel={isFree ? t("inUse") : t("freeLabel")}
            onCta={() => {}}
            disabled={true}
            loading={false}
          />
          <PricingCard
            name={t("yearlyPro")}
            price={t("yearlyPrice")}
            periodLabel={t("perYear")}
            period={t("yearlyPeriod")}
            saving={t("yearlySaving")}
            features={t.raw("proPlanFeatures") as string[]}
            highlighted={true}
            isCurrent={!isFree}
            ctaLabel={isFree ? t("upgradeAction") : t("inUse")}
            onCta={() => {}}
            disabled={true}
            loading={false}
          />
          <PricingCard
            name={t("monthlyPro")}
            price={t("monthlyPrice")}
            periodLabel={t("perMonth")}
            period={t("monthlyPeriod")}
            features={t.raw("proPlanFeatures") as string[]}
            highlighted={false}
            isCurrent={false}
            ctaLabel={t("subscribePro")}
            onCta={() => {}}
            disabled={true}
            loading={false}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 mt-5 text-sm text-gray-400">
          <span>{t("quarterlyPlan")}</span>
          <span className="hidden sm:inline">|</span>
          <span>{t("halfyearPlan")}</span>
        </div>
      </div>

      {isFree && info?.isDemoUser && (
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

      {isFree && !info?.isDemoUser && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{t("paymentMethods")}</h3>
            <span className="text-xs text-gray-400">{t("payDesc")}</span>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                setPaying(true)
                setError("")
                try {
                  const res = await fetch("/api/alipay/create", { method: "POST" })
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
              className="flex-1 min-w-[160px] flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="4" fill="#1677FF"/>
                <path d="M19.695 15.07c3.426 1.158 4.203 1.22 4.203 1.22V3.846c0-2.124-1.705-3.845-3.81-3.845H3.914C1.808.001.102 1.722.102 3.846v16.31c0 2.123 1.706 3.845 3.813 3.845h16.173c2.105 0 3.81-1.722 3.81-3.845v-.157s-6.19-2.602-9.315-4.119c-2.096 2.602-4.8 4.181-7.607 4.181-4.75 0-6.361-4.19-4.112-6.949.49-.602 1.324-1.175 2.617-1.497 2.025-.502 5.247.313 8.266 1.317a16.796 16.796 0 0 0 1.341-3.302H5.781v-.952h4.799V6.975H4.77v-.953h5.81V3.591s0-.409.411-.409h2.347v2.84h5.744v.951h-5.744v1.704h4.69a19.453 19.453 0 0 1-1.986 5.06c1.424.52 2.702 1.011 3.654 1.333m-13.81-2.032c-.596.06-1.71.325-2.321.869-1.83 1.608-.735 4.55 2.968 4.55 2.151 0 4.301-1.388 5.99-3.61-2.403-1.182-4.438-2.028-6.637-1.809" fill="white"/>
              </svg>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{t("alipay")}</p>
                <p className="text-xs text-gray-400">{t("payFrom")}</p>
              </div>
              {paying && <span className="ml-auto text-xs text-gray-400 shrink-0">{t("redirecting")}</span>}
            </button>

            {info?.stripeConfigured && (
              <button
                onClick={() => handleStripeUpgrade("pro")}
                disabled={actionLoading !== null}
                className="flex-1 min-w-[160px] flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#FF6B35] hover:bg-orange-50/50 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="4" fill="#635BFF"/>
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="white"/>
                </svg>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{t("creditCard")}</p>
                  <p className="text-xs text-gray-400">{t("creditCardDesc")}</p>
                </div>
                {actionLoading === "pro" && <span className="ml-auto text-xs text-gray-400 shrink-0">{t("redirecting")}</span>}
              </button>
            )}

            {info?.creemConfigured && (
              <button
                onClick={handleCreemUpgrade}
                disabled={actionLoading !== null}
                className="flex-1 min-w-[160px] flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-green-400 hover:bg-green-50/50 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <svg className="w-7 h-7 shrink-0" viewBox="0 0 121 121" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="121" height="121" rx="16" fill="#151617"/>
                  <path d="M22.1102 11C24.1187 11.0001 25.9669 12.0982 26.9281 13.8619L51.2059 58.4106C52.5699 60.9134 55.7048 61.8368 58.2077 60.473C60.7108 59.109 61.6342 55.9742 60.2701 53.4712L41.5466 19.113C39.554 15.4566 42.2004 11 46.3645 11H103.806C107.885 11 110.539 15.2933 108.715 18.9416L65.0579 106.254C63.0356 110.298 57.2654 110.298 55.2431 106.254L11.5863 18.9416C9.76212 15.2933 12.4156 11 15.4946 11H22.1102Z" fill="white"/>
                </svg>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{t("creem")}</p>
                  <p className="text-xs text-gray-400">{t("creemDesc")}</p>
                </div>
                {actionLoading === "creem" && <span className="ml-auto text-xs text-gray-400 shrink-0">{t("redirecting")}</span>}
              </button>
            )}

            <button
              onClick={async () => {
                setActionLoading("check")
                setError("")
                try {
                  const res = await fetch("/api/creem/create-checkout")
                  const data = await res.json()
                  if (!data.checkoutId) {
                    setError(t("noPendingCreemOrder"))
                    return
                  }
                  const result = await fetch(`/api/creem/create-checkout?checkoutId=${data.checkoutId}`).then((r) => r.json())
                  if (result.paid) {
                    setMessage(t("paymentSuccessWithMessage", { message: result.message }))
                    setRefreshKey((k) => k + 1)
                  } else {
                    setError(result.message || t("paymentNotFound"))
                  }
                } catch (err) {
                  setError(t("queryFailed"))
                } finally {
                  setActionLoading(null)
                }
              }}
              disabled={actionLoading !== null}
              className="flex-1 min-w-[160px] flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <span className="text-lg shrink-0">🔍</span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{t("checkPayment")}</p>
                <p className="text-xs text-gray-400">{t("checkPaymentDesc")}</p>
              </div>
              {actionLoading === "check" && <span className="ml-auto text-xs text-gray-400 shrink-0">{t("querying")}</span>}
            </button>
          </div>
        </div>
      )}

      {!isFree && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-2">{t("subscriptionManage")}</h3>
          <p className="text-sm text-gray-500 mb-4">
            {t("subscriptionManageDesc")}
          </p>
        </div>
      )}

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
    </div>
  )
}