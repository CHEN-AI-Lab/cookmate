"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"

interface Order {
  id: string
  orderId: string
  channel: string
  amount: number
  status: string
  createdAt: string
}

export default function OrdersPage() {
  const t = useTranslations("orders")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const channelLabel: Record<string, string> = { alipay: t("channelAlipay"), creem: t("channelCreem"), stripe: t("channelStripe") }
  const [deleting, setDeleting] = useState<string | null>(null)
  const statusLabel: Record<string, string> = { PAID: t("completed"), PENDING: t("cancelled"), EXPIRED: t("expired") }
  const statusColor: Record<string, string> = {
    PAID: "text-green-600 bg-green-50",
    PENDING: "text-gray-400 bg-gray-100",
    EXPIRED: "text-gray-500 bg-gray-50",
  }
  const deleteOrder = async (orderId: string) => {
    if (!confirm(t("deleteConfirm"))) return
    setDeleting(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" })
      if (res.ok) setOrders((prev) => prev.filter((o) => o.orderId !== orderId))
    } catch (e) { console.error("delete order error:", e) }
    finally { setDeleting(null) }
  }

  return (
    <div className="space-y-8">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {orders.map((order, idx) => {
            const date = new Date(order.createdAt)
            return (
              <div
                key={order.id}
                className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 ${
                  idx !== orders.length - 1 ? "border-b border-gray-50" : ""
                } hover:bg-gray-50/50 transition-colors`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base shrink-0">
                    {order.channel === "alipay" && "🔵"}
                    {order.channel === "stripe" && "💳"}
                    {order.channel === "creem" && "⚡"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {channelLabel[order.channel] || order.channel}
                    </p>
                    <p className="text-xs text-gray-400">
                      {date.toLocaleDateString(undefined, {
                        year: "numeric", month: "2-digit", day: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-gray-900">
                    ¥{(order.amount / 100).toFixed(2)}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[order.status] || "text-gray-500 bg-gray-50"}`}>
                    {statusLabel[order.status] || order.status}
                  </span>
                  {order.status === "PENDING" && (
                    <button
                      onClick={() => deleteOrder(order.orderId)}
                      disabled={deleting === order.orderId}
                      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {deleting === order.orderId ? "..." : t("delete")}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Back to billing */}
      <div className="text-center">
        <Link
          href="/app/billing"
          className="text-sm text-gray-400 hover:text-[#FF6B35] transition-colors"
        >
          {t("backToBilling")}
        </Link>
      </div>
    </div>
  )
}