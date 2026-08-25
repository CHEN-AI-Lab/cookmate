"use client"

import { useState, useEffect } from "react"

interface CancelLog {
  id: string
  createdAt: string
  channel: string | null
  status: string
  userId: string | null
  subscriptionId: string | null
  error: string
}

interface CancelLogsResponse {
  total?: number
  failed?: number
  completed?: number
  lastFailedAt?: string | null
  logs?: CancelLog[]
  error?: string
}

export default function AdminCancelPage() {
  const [data, setData] = useState<CancelLogsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    fetch("/api/admin/cancel-logs")
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok) {
          setError(json.error || `请求失败 (${r.status})`)
          setData(null)
        } else {
          setData(json)
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return <div className="text-center py-16 text-text-secondary">加载中…</div>
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <p className="text-text-secondary text-sm mt-2">
            只有管理员（环境变量 ADMIN_EMAIL 配置的邮箱，且用该邮箱登录）才能访问此页面。
          </p>
        </div>
      </div>
    )
  }

  const logs = data?.logs ?? []

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">取消订阅审计</h1>
        <p className="text-text-secondary text-sm mt-1">
          这里记录每一次「取消订阅」尝试。状态为「失败」= 上游（Creem / Stripe）没取消成功，
          需去对应后台补刀，或让用户重新点一次「取消」。
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="失败取消" value={data?.failed ?? 0} tone="red" />
        <StatCard label="成功取消" value={data?.completed ?? 0} tone="green" />
        <StatCard label="总记录" value={data?.total ?? 0} tone="gray" />
      </div>

      {logs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-text-secondary">
          ✅ 暂无取消记录
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-text-secondary">
                <tr>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap">时间</th>
                  <th className="text-left px-4 py-3 font-medium">渠道</th>
                  <th className="text-left px-4 py-3 font-medium">状态</th>
                  <th className="text-left px-4 py-3 font-medium">用户ID</th>
                  <th className="text-left px-4 py-3 font-medium">订阅ID</th>
                  <th className="text-left px-4 py-3 font-medium">错误</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((l) => (
                  <tr key={l.id} className={l.status === "failed" ? "bg-red-50/50" : ""}>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtTime(l.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-700">{l.channel ?? "-"}</td>
                    <td className="px-4 py-3">
                      {l.status === "failed" ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">失败</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-semibold">成功</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{l.userId ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{l.subscriptionId ?? "-"}</td>
                    <td className="px-4 py-3 text-red-600 text-xs max-w-xs break-words">{l.error || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary text-sm hover:bg-gray-50"
        >
          刷新
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "red" | "green" | "gray" }) {
  const toneClass =
    tone === "red" ? "text-red-600" : tone === "green" ? "text-green-600" : "text-text-primary"
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-text-secondary text-sm">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </div>
  )
}

function fmtTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString("zh-CN", { hour12: false })
  } catch {
    return iso
  }
}
