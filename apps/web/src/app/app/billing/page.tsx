"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
      .catch((err) => { console.error("load billing info error:", err); setError("加载失败"); })
      .finally(() => setLoading(false))

    // 检测 URL 参数，清除后自动消失
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "true") {
      // 自动查询 Creem 支付结果，无感处理
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
            // 成功了，刷新页面状态
            setRefreshKey((k) => k + 1)
          }
          // 没成功也不提示，用户看到还是 FREE 自然会继续点
        })
        .catch(() => { /* 静默 */ })
      window.history.replaceState({}, "", window.location.pathname)
    } else if (params.get("canceled") === "true") {
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [refreshKey])

  // 支付成功后刷新
  const handlePaymentSuccess = () => {
    setRefreshKey((k) => k + 1)
    setMessage("🎉 支付成功！已升级到 Pro。")
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
        setError(data.error || "创建支付会话失败")
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error("stripe upgrade error:", err)
      setError("网络错误，请稍后重试")
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
        setError(data.error || "创建支付失败")
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error("creem upgrade error:", err)
      setError("网络错误，请稍后重试")
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
        setError(data.error || "创建管理会话失败")
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error("manage subscription error:", err)
      setError("网络错误，请稍后重试")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>

  const isFree = info?.subscriptionTier === "FREE"
  const hasAnyPayment = info?.stripeConfigured

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">💳 账单与订阅</h1>
        <p className="text-gray-500 mt-1 text-sm">管理你的订阅计划和付款方式</p>
      </div>

      {/* Success / Error messages */}
      {message && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          {message}
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">当前计划</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              {isFree ? "Free（免费版）" : "Pro（专业版）"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isFree
                ? "每天 1 次 AI 菜谱推荐"
                : "无限 AI 生成，享受全部 Pro 功能"}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              isFree
                ? "bg-gray-100 text-gray-600"
                : "bg-orange-50 text-[#FF6B35]"
            }`}
          >
            {isFree ? "🆓 免费版" : "🌟 Pro"}
          </span>
        </div>
        {!isFree && info?.subscriptionExpiryDate && (
          <p className="text-xs text-gray-400 mt-2">
            到期时间：{new Date(info.subscriptionExpiryDate).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}
      </div>

      {/* Plan comparison */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">选择计划</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PricingCard
            name="Free"
            price="0"
            period="/永久"
            features={["每天 1 次 AI 推荐", "无限食材位", "AI 菜谱生成"]}
            highlighted={false}
            isCurrent={isFree}
            ctaLabel={isFree ? "使用中" : "免费版"}
            onCta={() => {}}
            disabled={true}
            loading={false}
          />
          <PricingCard
            name="Pro"
            price="15"
            period="/月"
            features={["无限 AI 生成", "智能周计划", "购物清单", "饮食定制"]}
            highlighted={true}
            isCurrent={!isFree}
            ctaLabel={isFree ? "升级到 Pro" : "使用中"}
            onCta={() => {}}
            disabled={true}
            loading={false}
          />
        </div>
      </div>

      {/* Payment methods */}
      {isFree && info?.isDemoUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-lg mb-2">🔒 体验模式</p>
          <p className="text-sm text-amber-700 mb-4">
            体验用户无法使用支付功能。<br />
            注册账号后可升级到 Pro，解锁无限 AI 生成和周计划功能。
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#FF6B35] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 transition-all"
          >
            免费注册
          </Link>
        </div>
      )}

      {isFree && !info?.isDemoUser && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">支付方式</h3>
            <span className="text-xs text-gray-400">扫码即付 · 安全快捷</span>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {/* 支付宝 */}
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
                    setError(data.error || "创建支付失败")
                    setPaying(false)
                  }
                } catch {
                  setError("网络错误")
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
                <p className="font-semibold text-gray-900 text-sm">支付宝</p>
                <p className="text-xs text-gray-400">¥15/月</p>
              </div>
              {paying && <span className="ml-auto text-xs text-gray-400 shrink-0">跳转中...</span>}
            </button>

            {/* Stripe 国际支付 */}
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
                  <p className="font-semibold text-gray-900 text-sm">信用卡</p>
                  <p className="text-xs text-gray-400">$5/月 · Stripe</p>
                </div>
                {actionLoading === "pro" && <span className="ml-auto text-xs text-gray-400 shrink-0">跳转中...</span>}
              </button>
            )}

            {/* Creem 支付 */}
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
                  <p className="font-semibold text-gray-900 text-sm">Creem</p>
                  <p className="text-xs text-gray-400">信用卡 · 多种支付</p>
                </div>
                {actionLoading === "creem" && <span className="ml-auto text-xs text-gray-400 shrink-0">跳转中...</span>}
              </button>
            )}

            {/* 检测 Creem 付款状态 */}
            <button
              onClick={async () => {
                setActionLoading("check")
                setError("")
                try {
                  const res = await fetch("/api/creem/create-checkout")
                  const data = await res.json()
                  if (!data.checkoutId) {
                    setError("没有待处理的 Creem 订单，请先付款")
                    return
                  }
                  const result = await fetch(`/api/creem/create-checkout?checkoutId=${data.checkoutId}`).then((r) => r.json())
                  if (result.paid) {
                    setMessage("🎉 " + result.message)
                    setRefreshKey((k) => k + 1)
                  } else {
                    setError(result.message || "未检测到支付")
                  }
                } catch (err) {
                  setError("查询失败，请稍后重试")
                } finally {
                  setActionLoading(null)
                }
              }}
              disabled={actionLoading !== null}
              className="flex-1 min-w-[160px] flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <span className="text-lg shrink-0">🔍</span>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm">检测付款状态</p>
                <p className="text-xs text-gray-400">付完款后点击确认</p>
              </div>
              {actionLoading === "check" && <span className="ml-auto text-xs text-gray-400 shrink-0">查询中...</span>}
            </button>
          </div>
        </div>
      )}

      {/* Manage subscription (for Pro users) */}
    </div>
  )
}