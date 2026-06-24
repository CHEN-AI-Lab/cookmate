"use client"

import { useState, useEffect, useCallback } from "react"

interface PaymentModalProps {
  channel: "wechat" | "alipay"
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ channel, onClose, onSuccess }: PaymentModalProps) {
  const [codeUrl, setCodeUrl] = useState("")
  const [payjsOrderId, setPayjsOrderId] = useState("")
  const [loading, setLoading] = useState(true)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState("")

  const channelLabel = channel === "wechat" ? "微信支付" : "支付宝"
  const channelIcon = channel === "wechat" ? "💚" : "💙"

  // 创建订单
  useEffect(() => {
    const create = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "创建订单失败")
          return
        }
        setCodeUrl(data.codeUrl)
        setPayjsOrderId(data.payjsOrderId)
      } catch {
        setError("网络错误，请稍后重试")
      } finally {
        setLoading(false)
      }
    }
    create()
  }, [channel])

  // 轮询支付状态
  useEffect(() => {
    if (!payjsOrderId || paid) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payjsOrderId }),
        })
        const data = await res.json()
        if (data.paid) {
          setPaid(true)
          clearInterval(interval)
          // 2 秒后关闭弹窗，触发父组件刷新
          setTimeout(() => onSuccess(), 2000)
        }
      } catch {
        // 静默失败，继续轮询
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [payjsOrderId, paid, onSuccess])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 text-center relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg"
        >
          ✕
        </button>

        {loading ? (
          <div className="py-8">
            <div className="animate-spin w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-500 text-sm">正在创建支付订单...</p>
          </div>
        ) : paid ? (
          <div className="py-8">
            <div className="text-5xl">🎉</div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">支付成功！</h3>
            <p className="mt-2 text-sm text-gray-500">已升级到 Pro，正在返回...</p>
          </div>
        ) : error ? (
          <div className="py-8">
            <div className="text-4xl mb-4">😵</div>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 text-gray-500 text-sm underline"
            >
              返回重试
            </button>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-2">{channelIcon}</div>
            <h3 className="text-xl font-bold text-gray-900">{channelLabel} 支付</h3>
            <p className="text-sm text-gray-500 mt-1">CookMate Pro · ¥15/月</p>

            {/* QR Code */}
            <div className="mt-6 mx-auto w-48 h-48 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
              {codeUrl ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(codeUrl)}`}
                  alt={`使用${channelLabel}扫码支付`}
                  className="w-full h-full"
                />
              ) : (
                <div className="text-gray-300 text-sm">二维码加载中...</div>
              )}
            </div>

            <p className="mt-4 text-xs text-gray-400">
              打开{channelLabel}扫一扫，扫码支付
            </p>

            <p className="mt-6 text-xs text-gray-400">
              支付完成后自动确认，请勿关闭此页面
            </p>
          </>
        )}
      </div>
    </div>
  )
}