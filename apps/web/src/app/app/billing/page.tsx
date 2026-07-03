"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PricingCard } from "@/components/features/PricingCard"
import { PaymentModal } from "@/components/features/PaymentModal"

interface BillingInfo {
  subscriptionTier: string
  stripeConfigured: boolean
  paymentConfigured: boolean
}

export default function BillingPage() {
  const [info, setInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState<"wechat" | "alipay" | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setInfo({
          subscriptionTier: data.subscriptionTier || "FREE",
          stripeConfigured: !!data.stripeConfigured,
          paymentConfigured: !!data.paymentConfigured,
        })
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false))

    // 检测 URL 参数
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") === "true") {
      setMessage("🎉 订阅成功！感谢你的支持。")
    } else if (params.get("canceled") === "true") {
      setMessage("")
    }
  }, [refreshKey])

  // 支付成功后刷新
  const handlePaymentSuccess = () => {
    setShowPaymentModal(null)
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
    } catch {
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
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">加载中...</div>

  const isFree = info?.subscriptionTier === "FREE"
  const hasAnyPayment = info?.stripeConfigured || info?.paymentConfigured

  return (
    <div className="space-y-8">
      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          channel={showPaymentModal}
          onClose={() => setShowPaymentModal(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

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
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
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
      </div>

      {/* Not configured warning */}
      {!hasAnyPayment && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          🔧 支付正在配置中，上线后即可使用支付宝/微信/国际信用卡支付。
        </div>
      )}

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
      {isFree && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">支付方式</h3>

          {/* 国内支付 */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-3">
              支持国内主流支付方式，扫码即付
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                disabled={!info?.paymentConfigured || actionLoading !== null || paying}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
              >
                <span className="text-3xl">💙</span>
                <div>
                  <p className="font-semibold text-gray-900">支付宝</p>
                  <p className="text-xs text-gray-400">¥15/月</p>
                </div>
                {paying && <span className="ml-auto text-sm text-gray-400">跳转中...</span>}
              </button>
              <button
                onClick={() => setShowPaymentModal("wechat")}
                disabled={!info?.paymentConfigured || actionLoading !== null}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
              >
                <span className="text-3xl">💚</span>
                <div>
                  <p className="font-semibold text-gray-900">微信支付</p>
                  <p className="text-xs text-gray-400">¥15/月</p>
                </div>
              </button>
            </div>
            {!info?.paymentConfigured && (
              <p className="text-xs text-gray-400 mt-2">支付宝/微信支付正在配置中</p>
            )}
          </div>

          {/* Stripe 国际支付 */}
          {info?.stripeConfigured && (
            <div className="border-t border-gray-50 pt-4">
              <p className="text-sm text-gray-500 mb-3">国际支付</p>
              <button
                onClick={() => handleStripeUpgrade("pro")}
                disabled={actionLoading !== null}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#FF6B35] hover:bg-orange-50/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left w-full"
              >
                <span className="text-2xl">💳</span>
                <div>
                  <p className="font-semibold text-gray-900">信用卡 / Stripe</p>
                  <p className="text-xs text-gray-400">支持国际信用卡，$5/月</p>
                </div>
                {actionLoading === "pro" && (
                  <span className="ml-auto text-sm text-gray-400">跳转中...</span>
                )}
              </button>
            </div>
          )}
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