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
        })
      })
      .catch((err) => { console.error("load billing info error:", err); setError("加载失败"); })
      .finally(() => setLoading(false))

    // 检测 URL 参数，清除后自动消失
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "true") {
      const timer = setTimeout(() => {
        setMessage("🎉 订阅成功！感谢你的支持。")
        // 3 秒后自动消失
        setTimeout(() => setMessage(""), 3000)
      }, 0)
      // 清除 URL 参数，防止刷新后重复显示
      window.history.replaceState({}, "", window.location.pathname)
      return () => clearTimeout(timer)
    } else if (params.get("canceled") === "true") {
      // 取消支付，不显示消息
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
                <span className="text-2xl shrink-0">💳</span>
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
                <span className="text-2xl shrink-0">💚</span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">Creem</p>
                  <p className="text-xs text-gray-400">信用卡 · 多种支付</p>
                </div>
                {actionLoading === "creem" && <span className="ml-auto text-xs text-gray-400 shrink-0">跳转中...</span>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Manage subscription (for Pro users) */}
      {!isFree && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-2">管理订阅</h3>
          <p className="text-sm text-gray-500 mb-4">
            管理你的订阅状态，如需取消请联系我们
          </p>
        </div>
      )}

      {/* Back to dashboard */}
      <div className="text-center">
        <Link
          href="/app/dashboard"
          className="text-sm text-gray-400 hover:text-[#FF6B35] transition-colors"
        >
          ← 返回仪表盘
        </Link>
      </div>
    </div>
  )
}