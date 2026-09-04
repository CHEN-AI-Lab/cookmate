"use client"

import { useState, useEffect, useCallback } from "react"

// ── 类型 ──

interface CancelLog {
  id: string
  createdAt: string
  channel: string | null
  status: string
  userId: string | null
  userEmail: string | null
  userName: string | null
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

interface AdminOrder {
  id: string
  orderId: string
  channel: string
  period: string | null
  amount: number
  status: string
  createdAt: string
  userEmail: string | null
}

interface OrdersResponse {
  total?: number
  paidCount?: number
  totalRevenue?: number
  orders?: AdminOrder[]
  error?: string
}

interface WebhookLogItem {
  id: string
  source: string
  eventType: string | null
  status: string
  eventId: string | null
  userId: string | null
  userEmail: string | null
  userName: string | null
  subscriptionId: string | null
  orderId: string | null
  createdAt: string
  rawPreview: string
}

interface WebhookLogsResponse {
  total?: number
  failed?: number
  logs?: WebhookLogItem[]
  error?: string
}

interface AdminUser {
  id: string
  email: string | null
  name: string | null
  phone: string | null
  subscriptionTier: string
  subscriptionExpiryDate: string | null
  onboardingCompleted: boolean
  createdAt: string
  orderCount: number
}

interface UsersResponse {
  total?: number
  proCount?: number
  freeCount?: number
  users?: AdminUser[]
  error?: string
}

interface CronLogItem {
  id: string
  eventType: string | null
  status: string
  detail: Record<string, unknown>
  createdAt: string
}

interface CronLogsResponse {
  total?: number
  logs?: CronLogItem[]
  error?: string
}

interface ConfigResponse {
  ok?: boolean
  config?: {
    app: { url: string }
    creem: { apiKey: string; monthlyProductId: string; annualProductId: string; webhookSecret: string }
    alipay: { appId: string; privateKey: string; publicKey: string }
    auth: { authSecret: string; adminEmails: string }
    cron: { cronSecret: string }
    database: { directUrl: string }
  }
  error?: string
}

type Tab = "orders" | "webhooks" | "cancels" | "users" | "crons" | "config"

// ── 工具 ──

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false })
  } catch {
    return iso
  }
}

function fmtAmount(fen: number) {
  return `¥${(fen / 100).toFixed(2)}`
}

function fmtPeriod(period: string | null) {
  if (period === "annual") return "年付"
  if (period === "monthly") return "月付"
  return "-"
}

// 并发拉取订单 / 回调流水 / 取消审计 / 用户列表 / Cron 日志 / 支付配置六组数据
function fetchAdminData() {
  return Promise.all([
    fetch("/api/admin/orders").then(async (r) => ({ ok: r.ok, data: await r.json() })),
    fetch("/api/admin/webhook-logs").then(async (r) => ({ ok: r.ok, data: await r.json() })),
    fetch("/api/admin/cancel-logs").then(async (r) => ({ ok: r.ok, data: await r.json() })),
    fetch("/api/admin/users").then(async (r) => ({ ok: r.ok, data: await r.json() })),
    fetch("/api/admin/cron-logs").then(async (r) => ({ ok: r.ok, data: await r.json() })),
    fetch("/api/admin/config").then(async (r) => ({ ok: r.ok, data: await r.json() })),
  ])
}

// ── 页面 ──

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("orders")

  // 订单
  const [ordersData, setOrdersData] = useState<OrdersResponse | null>(null)
  // 回调流水
  const [webhookData, setWebhookData] = useState<WebhookLogsResponse | null>(null)
  // 取消审计
  const [cancelData, setCancelData] = useState<CancelLogsResponse | null>(null)
  // 用户列表
  const [usersData, setUsersData] = useState<UsersResponse | null>(null)
  // Cron 日志
  const [cronData, setCronData] = useState<CronLogsResponse | null>(null)
  // 支付配置
  const [configData, setConfigData] = useState<ConfigResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 统一处理五个接口的返回结果
  const applyResult = useCallback((results: { ok: boolean; data: { error?: string } }[]) => {
    const [orders, webhooks, cancels, users, crons, config] = results
    const firstErr = results.find((x) => !x.ok)
    if (firstErr) {
      setError(firstErr.data.error || `请求失败`)
      return
    }
    setOrdersData(orders.data as OrdersResponse)
    setWebhookData(webhooks.data as WebhookLogsResponse)
    setCancelData(cancels.data as CancelLogsResponse)
    setUsersData(users.data as UsersResponse)
    setCronData(crons.data as CronLogsResponse)
    setConfigData(config.data as ConfigResponse)
  }, [])

  // 首次加载：loading/error 已由 useState 默认值（true/null）提供，
  // effect 内不同步 setState，避免级联渲染（react-hooks 规则）
  useEffect(() => {
    let cancelled = false
    fetchAdminData()
      .then((res) => {
        if (!cancelled) applyResult(res)
      })
      .catch((e) => {
        if (!cancelled) setError(String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [applyResult])

  // 手动刷新（事件处理器内允许同步 setState）
  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchAdminData()
      .then((res) => applyResult(res))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [applyResult])

  if (loading) {
    return <div className="text-center py-16 text-text-secondary">加载中…</div>
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">{error}</p>
          <p className="text-text-secondary text-sm mt-2">
            无权限访问此页面，仅限管理员使用。
          </p>
        </div>
      </div>
    )
  }

  const tabs: Array<{ key: Tab; label: string; badge?: number; badgeTone?: "red" | "gray" }> = [
    { key: "orders", label: "订单列表", badge: ordersData?.total ?? 0, badgeTone: "gray" },
    { key: "webhooks", label: "回调流水", badge: webhookData?.total ?? 0, badgeTone: "gray" },
    {
      key: "cancels",
      label: "取消审计",
      badge: (cancelData?.failed ?? 0) > 0 ? cancelData?.failed : undefined,
      badgeTone: "red",
    },
    { key: "users", label: "用户列表", badge: usersData?.total ?? 0, badgeTone: "gray" },
    {
      key: "crons",
      label: "Cron 日志",
      badge: (cronData?.logs ?? []).some((l) => l.status === "failed") ? 1 : undefined,
      badgeTone: "red",
    },
    { key: "config", label: "支付配置" },
  ]

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">支付后台</h1>
        <p className="text-text-secondary text-sm mt-1">
          订单 / 回调 / 取消审计 一站式查看。各列表最多展示最近 200 条（最新在前）。
        </p>
      </div>

      {/* Tab 栏 */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors flex items-center gap-2 ${
              tab === t.key
                ? "bg-card text-text-primary border border-b-0 border-gray-200"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  t.badgeTone === "red" ? "bg-red-100 text-red-600" : "bg-surface text-text-secondary"
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "orders" && <OrdersTab data={ordersData} />}
      {tab === "webhooks" && <WebhooksTab data={webhookData} />}
      {tab === "cancels" && <CancelsTab data={cancelData} />}
      {tab === "users" && <UsersTab data={usersData} />}
      {tab === "crons" && <CronsTab data={cronData} />}
      {tab === "config" && <ConfigTab data={configData} />}

      <div className="flex justify-end">
        <button
          onClick={refresh}
          className="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary text-sm hover:bg-gray-50"
        >
          刷新
        </button>
      </div>
    </div>
  )
}

// ── Tab 1：订单列表 ──

function OrdersTab({ data }: { data: OrdersResponse | null }) {
  const orders = data?.orders ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="总订单" value={data?.total ?? 0} tone="gray" />
        <StatCard label="已支付" value={data?.paidCount ?? 0} tone="green" />
        <StatCard label="累计收入" value={fmtAmount(data?.totalRevenue ?? 0)} tone="amber" />
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-text-secondary">
          暂无订单
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-text-secondary">
                <tr>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap" title="订单创建时间">时间</th>
                  <th className="text-left px-4 py-3 font-medium" title="Creem/支付宝生成的订单号">订单号</th>
                  <th className="text-left px-4 py-3 font-medium" title="支付渠道：creem 或 alipay">渠道</th>
                  <th className="text-left px-4 py-3 font-medium" title="订阅周期：monthly 月付 / annual 年付">周期</th>
                  <th className="text-left px-4 py-3 font-medium" title="订单金额（CNY）">金额</th>
                  <th className="text-left px-4 py-3 font-medium" title="订单状态：待支付/已支付/已取消/已退款/已过期">状态</th>
                  <th className="text-left px-4 py-3 font-medium" title="下单用户的邮箱">用户邮箱</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className={o.status === "PAID" ? "" : "opacity-60"}>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtTime(o.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{o.orderId}</td>
                    <td className="px-4 py-3 text-gray-700">{o.channel}</td>
                    <td className="px-4 py-3 text-gray-700">{fmtPeriod(o.period)}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{fmtAmount(o.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{o.userEmail ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 2：回调流水 ──

function WebhooksTab({ data }: { data: WebhookLogsResponse | null }) {
  const logs = data?.logs ?? []
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="回调总数" value={data?.total ?? 0} tone="gray" />
        <StatCard label="失败回调" value={data?.failed ?? 0} tone={(data?.failed ?? 0) > 0 ? "red" : "gray"} />
      </div>

      {logs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-text-secondary">
          暂无回调记录
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-text-secondary">
                <tr>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap" title="回调到达时间">时间</th>
                  <th className="text-left px-4 py-3 font-medium" title="回调来源渠道（creem/alipay）">来源</th>
                  <th className="text-left px-4 py-3 font-medium" title="Creem/支付宝的事件类型，如 checkout.completed、subscription.paid">事件</th>
                  <th className="text-left px-4 py-3 font-medium" title="本条回调的处理结果：已收到/已处理/失败/重复跳过">状态</th>
                  <th className="text-left px-4 py-3 font-medium" title="Creem 分配的事件唯一标识（evt_xxx），用于去重，同一事件只保留一条">事件ID</th>
                  <th className="text-left px-4 py-3 font-medium" title="触发此回调的用户邮箱">用户</th>
                  <th className="text-left px-4 py-3 font-medium" title="Creem 订阅ID（sub_xxx），关联用户的订阅记录">订阅ID</th>
                  <th className="text-left px-4 py-3 font-medium" title="Creem 原始请求体 JSON，点击可展开查看">原文</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((l) => (
                  <tr key={l.id} className={l.status.startsWith("failed") ? "bg-red-50/50" : ""}>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtTime(l.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-700">{l.source}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{l.eventType ?? "-"}</td>
                    <td className="px-4 py-3">
                      <WebhookStatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs max-w-[160px] truncate" title={l.eventId ?? ""}>
                      {l.eventId ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                      {l.userEmail ?? (l.userId ? l.userId.slice(0, 8) + "…" : "-")}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs max-w-[120px] truncate" title={l.subscriptionId ?? ""}>
                      {l.subscriptionId ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {l.rawPreview ? (
                        <button
                          onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                          className="text-accent hover:underline"
                        >
                          {expandedId === l.id ? "收起" : "查看"}
                        </button>
                      ) : (
                        "-"
                      )}
                      {expandedId === l.id && (
                        <pre className="mt-2 p-2 bg-gray-50 rounded-lg text-xs max-w-md max-h-48 overflow-auto whitespace-pre-wrap break-all">
                          {l.rawPreview}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 3：取消审计 ──

function CancelsTab({ data }: { data: CancelLogsResponse | null }) {
  const logs = data?.logs ?? []

  return (
    <div className="space-y-4">
      <div>
        <p className="text-text-secondary text-sm">
          记录每一次「取消订阅」尝试。状态为「失败」= 上游（Creem）没取消成功，
          需去 Creem 后台补刀，或让用户重新点一次「取消」。
        </p>
      </div>

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
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap" title="取消操作时间">时间</th>
                  <th className="text-left px-4 py-3 font-medium" title="支付渠道：creem 或 alipay">渠道</th>
                  <th className="text-left px-4 py-3 font-medium" title="取消结果：成功=Creem确认取消/失败=上游拒绝">状态</th>
                  <th className="text-left px-4 py-3 font-medium" title="发起取消的用户ID（内部标识）">用户ID</th>
                  <th className="text-left px-4 py-3 font-medium" title="发起取消的用户邮箱">用户</th>
                  <th className="text-left px-4 py-3 font-medium" title="Creem 订阅ID（sub_xxx）">订阅ID</th>
                  <th className="text-left px-4 py-3 font-medium" title="失败时的错误信息">错误</th>
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
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs" title={l.userId ?? ""}>
                      {l.userId ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                      {l.userEmail ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{l.subscriptionId ?? "-"}</td>
                    <td className="px-4 py-3 text-red-600 text-xs max-w-xs break-words">{l.error || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 4：用户列表 ──

function UsersTab({ data }: { data: UsersResponse | null }) {
  const users = data?.users ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="用户总数" value={data?.total ?? 0} tone="gray" />
        <StatCard label="Pro 用户" value={data?.proCount ?? 0} tone="green" />
        <StatCard label="免费用户" value={data?.freeCount ?? 0} tone="gray" />
      </div>

      {users.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-text-secondary">
          暂无用户
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-text-secondary">
                <tr>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap" title="用户注册时间">注册时间</th>
                  <th className="text-left px-4 py-3 font-medium" title="注册邮箱">邮箱</th>
                  <th className="text-left px-4 py-3 font-medium" title="用户昵称">用户名</th>
                  <th className="text-left px-4 py-3 font-medium" title="当前套餐：FREE 免费版 / PRO 付费版">套餐</th>
                  <th className="text-left px-4 py-3 font-medium" title="付费到期时间（FREE 用户为空）">到期时间</th>
                  <th className="text-left px-4 py-3 font-medium" title="该用户创建的订单总数">订单数</th>
                  <th className="text-left px-4 py-3 font-medium" title="新用户引导是否完成">引导完成</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtTime(u.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{u.email ?? u.phone ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{u.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      {u.subscriptionTier === "PRO" ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-xs font-semibold">Pro</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">Free</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                      {u.subscriptionExpiryDate ? fmtTime(u.subscriptionExpiryDate) : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.orderCount}</td>
                    <td className="px-4 py-3 text-gray-700">{u.onboardingCompleted ? "✅" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 5：Cron 日志 ──

function CronsTab({ data }: { data: CronLogsResponse | null }) {
  const logs = data?.logs ?? []

  return (
    <div className="space-y-4">
      <div>
        <p className="text-text-secondary text-sm">
          Vercel Cron 定时任务执行记录（每日 03:00 过期降级 / 04:00 取消对账）。
          状态为「失败」= 定时任务执行出错，需检查服务端日志。
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-text-secondary">
          暂无 Cron 执行记录（部署后每日自动执行，执行时写入）
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-text-secondary">
                <tr>
                  <th className="text-left px-4 py-3 font-medium whitespace-nowrap" title="Cron 任务执行时间">执行时间</th>
                  <th className="text-left px-4 py-3 font-medium" title="定时任务名称：expire-sweep 过期降级 / reconcile-cancellations 取消对账">任务</th>
                  <th className="text-left px-4 py-3 font-medium" title="执行结果：success 成功 / error 失败">状态</th>
                  <th className="text-left px-4 py-3 font-medium" title="处理详情：受影响的用户数、失败数等">详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((l) => (
                  <tr key={l.id} className={l.status === "failed" ? "bg-red-50/50" : ""}>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtTime(l.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{l.eventType ?? "-"}</td>
                    <td className="px-4 py-3">
                      {l.status === "failed" ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">失败</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-semibold">成功</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs max-w-md break-words">
                      <pre className="whitespace-pre-wrap break-all font-mono text-xs">{JSON.stringify(l.detail)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 通用组件 ──

function StatCard({ label, value, tone }: { label: string; value: number | string; tone: "red" | "green" | "gray" | "amber" }) {
  const toneClass =
    tone === "red"
      ? "text-red-600"
      : tone === "green"
        ? "text-green-600"
        : tone === "amber"
          ? "text-amber-600"
          : "text-text-primary"
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-text-secondary text-sm">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${toneClass}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PAID") {
    return <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-semibold">已支付</span>
  }
  if (status === "PENDING") {
    return <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-xs font-semibold">待支付</span>
  }
  return <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">{status}</span>
}

function WebhookStatusBadge({ status }: { status: string }) {
  const cnLabel: Record<string, string> = {
    received: "已收到",
    processed: "已处理",
    duplicate: "重复跳过",
    ignored: "已忽略",
    "failed:signature": "签名失败",
    "failed:unresolved": "无法解析",
    "failed:user-not-found": "用户不存在",
    "failed:error": "处理异常",
    "ignored:late-downgrade": "迟到降级跳过",
  }
  const tone: Record<string, string> = {
    received: "bg-amber-100 text-amber-600",
    processed: "bg-green-100 text-green-600",
    duplicate: "bg-blue-100 text-blue-600",
    ignored: "bg-gray-100 text-gray-500",
  }
  const failed = status.startsWith("failed")
  const ignored = status.startsWith("ignored")
  const cls = failed
    ? "bg-red-100 text-red-600"
    : ignored
      ? "bg-gray-100 text-gray-500"
      : tone[status] || "bg-gray-100 text-gray-500"
  // 显示中文，悬浮显示英文原文
  const cnText = cnLabel[status] || status
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}
      title={status}
    >
      {cnText}
    </span>
  )
}

// ── Tab 6：支付配置 ──

function ConfigRow({ label, value, required }: { label: string; value: string; required?: boolean }) {
  const isMasked = value === "已配置" || value === "未配置"
  const isMissing = value === "未配置"
  const rowBg = isMissing && required ? "bg-red-50/50" : ""
  const valColor = isMasked
    ? isMissing ? "text-red-600" : "text-green-600"
    : "text-gray-700"
  return (
    <tr className={rowBg}>
      <td className="px-4 py-2.5 text-gray-700 font-medium whitespace-nowrap w-[140px]">
        {label}{required ? <span className="text-red-500">*</span> : ""}
      </td>
      <td className={`px-4 py-2.5 font-mono text-xs break-all ${valColor}`}>
        {isMasked ? `● ${value}` : value}
      </td>
    </tr>
  )
}

function ConfigTab({ data }: { data: ConfigResponse | null }) {
  const c = data?.config
  if (!c) {
    return <div className="text-center py-16 text-text-secondary">无法加载配置</div>
  }

  const sections = [
    { title: "应用", rows: [{ label: "应用地址", value: c.app.url }] },
    {
      title: "Creem 支付",
      rows: [
        { label: "API Key", value: c.creem.apiKey, required: true },
        { label: "月付产品 ID", value: c.creem.monthlyProductId, required: true },
        { label: "年付产品 ID", value: c.creem.annualProductId, required: true },
        { label: "Webhook 密钥", value: c.creem.webhookSecret, required: true },
      ],
    },
    {
      title: "支付宝",
      rows: [
        { label: "App ID", value: c.alipay.appId },
        { label: "私钥", value: c.alipay.privateKey },
        { label: "公钥", value: c.alipay.publicKey },
      ],
    },
    {
      title: "认证",
      rows: [
        { label: "AUTH_SECRET", value: c.auth.authSecret, required: true },
        { label: "管理员邮箱", value: c.auth.adminEmails },
      ],
    },
    {
      title: "Cron 定时任务",
      rows: [{ label: "CRON_SECRET", value: c.cron.cronSecret, required: true }],
    },
    {
      title: "数据库",
      rows: [{ label: "直连 URL", value: c.database.directUrl, required: true }],
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">
        生产环境配置核对（只显示是否已配置，不暴露密钥原文）。带 * 为必填项，标红「未配置」会导致对应功能不可用。
      </p>
      {sections.map((s) => (
        <div key={s.title} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <h3 className="px-4 py-3 font-semibold text-text-primary bg-gray-50 border-b border-gray-100">{s.title}</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {s.rows.map((r) => (
                <ConfigRow key={r.label} label={r.label} value={r.value} required={r.required} />
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
