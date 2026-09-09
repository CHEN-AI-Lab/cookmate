"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { CHANNEL_ICONS } from "@cookmate/shared/constants/payment-channels"
import { PRICING, type BillingPeriod } from "@cookmate/shared/constants/pricing"

interface Order {
  id: string
  orderId: string
  channel: string
  amount: number
  currency?: string
  paidAmount?: number | null
  paidCurrency?: string | null
  status: string
  createdAt: string
}

function planLabel(amount: number, locale: string, t: (key: string) => string): string {
  const periods: BillingPeriod[] = ["monthly", "quarterly", "semiannual", "annual"]
  // 遍历所有周期，CNY 和 USD 两种币种都匹配
  for (const period of periods) {
    const cny = PRICING.get(period, "CNY").amount
    const usd = PRICING.get(period, "USD").amount
    if (amount === cny || amount === usd) {
      if (locale === "zh-CN" || locale === "zh-TW") {
        const labels: Record<BillingPeriod, string> = {
          monthly: "Pro 月付",
          quarterly: "Pro 季付",
          semiannual: "Pro 半年付",
          annual: "Pro 年付",
        }
        return labels[period]
      }
      const labels: Record<BillingPeriod, string> = {
        monthly: t("monthlyPro"),
        quarterly: t("quarterlyPlan"),
        semiannual: t("halfyearPlan"),
        annual: t("yearlyPro"),
      }
      return labels[period]
    }
  }
  return "Pro"
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", CNY: "¥" }

// 按订单的 currency 字段显示币种
function fmtOrderAmount(order: { currency?: string; amount: number }): string {
  const symbol = order.currency ? (CURRENCY_SYMBOLS[order.currency] || "?") : "?"
  return `${symbol}${(order.amount / 100).toFixed(2)}`
}

export default function OrdersPage() {
  const t = useTranslations("orders")
  const tb = useTranslations("billing")
  const locale = useLocale()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [toast, setToast] = useState("")

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const channelLabel: Record<string, string> = { alipay: t("channelAlipay"), creem: t("channelCreem") }
  const statusLabel: Record<string, string> = { PAID: t("completed"), PENDING: t("pending"), CANCELED: t("cancelled"), EXPIRED: t("expired") }
  const statusColor: Record<string, string> = {
    PAID: "text-green-600 bg-green-50",
    PENDING: "text-amber-600 bg-amber-50",
    CANCELED: "text-text-secondary bg-surface",
    EXPIRED: "text-text-secondary bg-surface",
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(deleteTarget)
    setDeleteTarget(null)
    try {
      const res = await fetch(`/api/orders/${deleteTarget}`, { method: "DELETE" })
      if (res.ok) { setOrders((prev) => prev.filter((o) => o.orderId !== deleteTarget)); setToast(t("deleteSuccess")); setTimeout(() => setToast(""), 2500) }
    } catch (e) { console.error("delete order error:", e) }
    finally { setDeleting(null) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
        <p className="text-text-secondary mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-secondary">{t("loading")}</div>
      ) : orders.length === 0 ? (
        <div className="bg-card rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-text-secondary text-lg mb-2">{t("noOrders")}</p>
          <p className="text-text-secondary text-sm">{t("noOrdersHint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const date = new Date(order.createdAt)
            const isExpanded = expandedId === order.id
            return (
              <div key={order.id} className="bg-card rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-surface/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 shrink-0" dangerouslySetInnerHTML={{ __html: CHANNEL_ICONS[order.channel] || "" }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">{channelLabel[order.channel] || order.channel}</p>
                      <p className="text-xs text-text-secondary">
                        {date.toLocaleDateString(locale, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-text-primary">{fmtOrderAmount(order)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status] || "text-text-secondary bg-surface"}`}>
                      {statusLabel[order.status] || order.status}
                    </span>
                    <svg className={`w-4 h-4 text-text-secondary transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 border-t border-border pt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">{t("orderId")}</span>
                      <span className="text-text-secondary font-mono text-xs break-all max-w-[200px] text-right">{order.orderId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">{t("plan")}</span>
                      <span className="text-text-secondary font-semibold">{planLabel(order.amount, locale, tb)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">{t("amount")}</span>
                      <span className="text-text-secondary font-semibold">{fmtOrderAmount(order)}</span>
                    </div>
                    {order.paidAmount != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">{t("paidAmount")}</span>
                        <span className={`font-semibold ${order.paidAmount !== order.amount ? "text-red-600" : "text-text-secondary"}`}>
                          {fmtOrderAmount({ amount: order.paidAmount, currency: order.paidCurrency ?? order.currency })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">{t("status")}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status] || "text-text-secondary bg-surface"}`}>
                        {statusLabel[order.status] || order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">{t("date")}</span>
                      <span className="text-text-secondary">
                        {date.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {order.status === "PENDING" && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(order.orderId) }}
                          disabled={deleting === order.orderId}
                          className="text-xs text-red-600 hover:text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                          {deleting === order.orderId ? "..." : t("delete")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="text-center">
        <Link href="/app/billing" className="text-sm text-text-secondary hover:text-accent transition-colors">
          {t("backToBilling")}
        </Link>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-bg-inverse text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          ✅ {toast}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-card rounded-2xl shadow-xl p-6 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <p className="font-bold text-text-primary text-lg mb-2">{t("deleteConfirm")}</p>
            <p className="text-sm text-text-secondary mb-6">{t("deleteConfirmHint")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 text-sm text-text-secondary border border-gray-100 rounded-xl hover:bg-surface transition-colors font-medium">{t("cancel")}</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-500 transition-colors font-medium">{t("confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
