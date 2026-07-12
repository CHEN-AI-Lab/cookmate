"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"

interface Order {
  id: string
  orderId: string
  channel: string
  amount: number
  status: string
  createdAt: string
}

const CHANNEL_ICONS: Record<string, string> = {
  alipay: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#1677FF"/><path d="M19.695 15.07c3.426 1.158 4.203 1.22 4.203 1.22V3.846c0-2.124-1.705-3.845-3.81-3.845H3.914C1.808.001.102 1.722.102 3.846v16.31c0 2.123 1.706 3.845 3.813 3.845h16.173c2.105 0 3.81-1.722 3.81-3.845v-.157s-6.19-2.602-9.315-4.119c-2.096 2.602-4.8 4.181-7.607 4.181-4.75 0-6.361-4.19-4.112-6.949.49-.602 1.324-1.175 2.617-1.497 2.025-.502 5.247.313 8.266 1.317a16.796 16.796 0 0 0 1.341-3.302H5.781v-.952h4.799V6.975H4.77v-.953h5.81V3.591s0-.409.411-.409h2.347v2.84h5.744v.951h-5.744v1.704h4.69a19.453 19.453 0 0 1-1.986 5.06c1.424.52 2.702 1.011 3.654 1.333m-13.81-2.032c-.596.06-1.71.325-2.321.869-1.83 1.608-.735 4.55 2.968 4.55 2.151 0 4.301-1.388 5.99-3.61-2.403-1.182-4.438-2.028-6.637-1.809" fill="white"/></svg>`,
  stripe: `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full"><rect width="24" height="24" rx="4" fill="#635BFF"/><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" fill="white"/></svg>`,
  creem: `<svg viewBox="0 0 121 121" fill="none" class="w-full h-full"><rect width="121" height="121" rx="16" fill="#151617"/><path d="M22.1102 11C24.1187 11.0001 25.9669 12.0982 26.9281 13.8619L51.2059 58.4106C52.5699 60.9134 55.7048 61.8368 58.2077 60.473C60.7108 59.109 61.6342 55.9742 60.2701 53.4712L41.5466 19.113C39.554 15.4566 42.2004 11 46.3645 11H103.806C107.885 11 110.539 15.2933 108.715 18.9416L65.0579 106.254C63.0356 110.298 57.2654 110.298 55.2431 106.254L11.5863 18.9416C9.76212 15.2933 12.4156 11 15.4946 11H22.1102Z" fill="white"/></svg>`,
}

function planLabel(amount: number, locale: string): string {
  const yuan = amount / 100
  const isEn = locale === "en"
  if (yuan === 119) return isEn ? "Pro Yearly" : "Pro 年付"
  if (yuan === 20) return isEn ? "Pro Monthly" : "Pro 月付"
  if (yuan === 51) return isEn ? "Pro Quarterly" : "Pro 季付"
  if (yuan === 90) return isEn ? "Pro Half-Year" : "Pro 半年付"
  return "Pro"
}

export default function OrdersPage() {
  const t = useTranslations("orders")
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

  const channelLabel: Record<string, string> = { alipay: t("channelAlipay"), creem: t("channelCreem"), stripe: t("channelStripe") }
  const statusLabel: Record<string, string> = { PAID: t("completed"), PENDING: t("cancelled"), EXPIRED: t("expired") }
  const statusColor: Record<string, string> = {
    PAID: "text-green-600 bg-green-50",
    PENDING: "text-gray-400 bg-gray-100",
    EXPIRED: "text-gray-500 bg-gray-50",
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
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">{t("loading")}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400 text-lg mb-2">{t("noOrders")}</p>
          <p className="text-gray-400 text-sm">{t("noOrdersHint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const date = new Date(order.createdAt)
            const isExpanded = expandedId === order.id
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-gray-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 shrink-0" dangerouslySetInnerHTML={{ __html: CHANNEL_ICONS[order.channel] || "" }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{channelLabel[order.channel] || order.channel}</p>
                      <p className="text-xs text-gray-400">
                        {date.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-gray-900">¥{(order.amount / 100).toFixed(2)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status] || "text-gray-500 bg-gray-50"}`}>
                      {statusLabel[order.status] || order.status}
                    </span>
                    <svg className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 border-t border-gray-50 pt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t("orderId")}</span>
                      <span className="text-gray-500 font-mono text-xs break-all max-w-[200px] text-right">{order.orderId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t("plan")}</span>
                      <span className="text-gray-600 font-semibold">{planLabel(order.amount, locale)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t("amount")}</span>
                      <span className="text-gray-600 font-semibold">¥{(order.amount / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t("status")}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[order.status] || "text-gray-500 bg-gray-50"}`}>
                        {statusLabel[order.status] || order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{t("date")}</span>
                      <span className="text-gray-600">
                        {date.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {order.status === "PENDING" && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(order.orderId) }}
                          disabled={deleting === order.orderId}
                          className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
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
        <Link href="/app/billing" className="text-sm text-gray-400 hover:text-[#FF6B35] transition-colors">
          {t("backToBilling")}
        </Link>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D3436] text-white px-6 py-3 rounded-xl text-sm shadow-lg z-50">
          ✅ {toast}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <p className="font-bold text-[#2D3436] text-lg mb-2">{t("deleteConfirm")}</p>
            <p className="text-sm text-gray-500 mb-6">{t("deleteConfirmHint")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium">{t("cancel")}</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors font-medium">{t("confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}