"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { SUBSCRIPTION_TIER } from "@cookmate/shared/constants"
import { CHANNEL_ICONS, CHANNEL_LABELS } from "@cookmate/shared/constants/payment-channels"
import { useTableQuery, type TableQuery } from "@cookmate/shared/hooks/useTableQuery"
import { isAmountMismatch, type SubscriptionStatus } from "@cookmate/shared/utils/admin-query"
import { Th } from "@/components/admin/ColumnFilter"
import { DataTablePagination } from "@/components/admin/DataTablePagination"

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
  totalAll?: number
  page?: number
  pageSize?: number
  failed?: number
  failedAll?: number
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
  currency: string
  paidAmount: number | null
  paidCurrency: string | null
  status: string
  createdAt: string
  userEmail: string | null
}

interface OrdersResponse {
  total?: number
  totalAll?: number
  page?: number
  pageSize?: number
  paidCount?: number
  creemRevenue?: number
  alipayRevenue?: number
  mismatchCount?: number
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
  totalAll?: number
  page?: number
  pageSize?: number
  failed?: number
  failedAll?: number
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
  subStatus?: SubscriptionStatus | null
}

interface UsersResponse {
  total?: number
  totalAll?: number
  page?: number
  pageSize?: number
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
  totalAll?: number
  page?: number
  pageSize?: number
  failed?: number
  failedAll?: number
  logs?: CronLogItem[]
  error?: string
}

type AiTone = "ok" | "warn" | "error" | "plain"

/** 带状态色的值（来源、专用 Key） */
interface AiValue {
  text: string
  tone: AiTone
}

/** 纯文本值，fromDefault 标明该值是回退默认来的还是这一端自己配的 */
interface AiPlain {
  text: string
  fromDefault: boolean
}

interface AiSide {
  source: AiValue
  key: AiValue
  model: AiPlain
  baseUrl: AiPlain
}

interface ConfigResponse {
  ok?: boolean
  config?: {
    app: { url: string }
    creem: { apiKey: string; monthlyProductId: string; annualProductId: string; webhookSecret: string }
    alipay: { appId: string; privateKey: string; publicKey: string }
    auth: { authSecret: string; adminEmails: string }
    oauth: { googleId: string; googleSecret: string; githubId: string; githubSecret: string }
    cron: { cronSecret: string }
    database: { directUrl: string }
    ai: {
      free: AiSide
      pro: AiSide
      fallback: { key: AiValue; model: AiPlain; baseUrl: AiPlain }
    }
    vercelEnvUrl: string | null
    vercelSlugMissing: boolean
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

// 金额格式化：按订单的 currency 字段区分币种（新增渠道只需加一行配置）
const CURRENCY_SYMBOLS: Record<string, string> = { USD: "$", CNY: "\u00a5" }

function fmtAmount(amount: number, currency?: string | null) {
  const symbol = currency ? (CURRENCY_SYMBOLS[currency] || "?") : "?"
  return `${symbol}${(amount / 100).toFixed(2)}`
}

function fmtPeriod(period: string | null) {
  if (period === "annual") return "年付"
  if (period === "monthly") return "月付"
  return "-"
}

// 回调事件类型中英映射：列表显示中文，悬浮显示英文原文（与状态列同一套做法）。
// 未收录的值原样回退显示。
const EVENT_CN: Record<string, string> = {
  "checkout.completed": "结账完成",
  "subscription.paid": "订阅已付款",
  "subscription.active": "订阅生效",
  "subscription.trialing": "订阅试用中",
  "subscription.update": "订阅信息更新",
  "subscription.canceled": "订阅已取消",
  "subscription.scheduled_cancel": "订阅预约取消",
  "subscription.paused": "订阅已暂停",
  "subscription.past_due": "订阅逾期未付",
  "subscription.expired": "订阅已过期",
  "refund.created": "退款已创建",
  TRADE_SUCCESS: "交易成功",
  WAIT_BUYER_PAY: "等待付款",
  TRADE_CLOSED: "交易关闭",
  TRADE_FINISHED: "交易完成",
  "appid-mismatch": "应用ID不符",
}

function WebhookEventCell({ eventType }: { eventType: string | null }) {
  if (!eventType) return <span className="text-gray-400">-</span>
  return (
    <span className="font-mono text-xs text-gray-700" title={eventType}>
      {EVENT_CN[eventType] ?? eventType}
    </span>
  )
}

// ── 筛选控件用到的静态选项 ──

const CHANNEL_OPTIONS = [
  { value: "creem", label: "Creem" },
  { value: "alipay", label: "支付宝" },
]

const PERIOD_OPTIONS = [
  { value: "monthly", label: "月付" },
  { value: "annual", label: "年付" },
]

const ORDER_STATUS_OPTIONS = [
  { value: "PAID", label: "已支付" },
  { value: "PENDING", label: "待支付" },
  { value: "CANCELED", label: "已取消" },
  { value: "EXPIRED", label: "已过期" },
  { value: "REFUNDED", label: "已退款" },
]

const WEBHOOK_STATUS_OPTIONS = [
  { value: "received", label: "已收到" },
  { value: "processed", label: "已处理" },
  { value: "processed:amount-mismatch", label: "金额不一致" },
  { value: "duplicate", label: "重复跳过" },
  { value: "ignored", label: "已忽略" },
  { value: "failed:signature", label: "签名失败" },
  { value: "failed:unresolved", label: "无法解析" },
  { value: "failed:user-not-found", label: "用户不存在" },
  { value: "failed:order-not-found", label: "订单不存在" },
  { value: "failed:amount-mismatch", label: "金额不一致（失败）" },
  { value: "failed:amount-unknown", label: "金额无法匹配" },
  { value: "failed:error", label: "处理异常" },
]

const EVENT_OPTIONS = Object.keys(EVENT_CN).map((k) => ({ value: k, label: EVENT_CN[k] }))

const TIER_OPTIONS = [
  { value: "PRO", label: "Pro" },
  { value: "FREE", label: "Free" },
]

// 用户订阅状态（口径对齐 Stripe / Chargebee：active / canceled / expired；一次性买断单列，不算取消）
const SUB_STATUS: Record<SubscriptionStatus, { label: string; cls: string }> = {
  active: { label: "订阅中（自动续费）", cls: "bg-green-100 text-green-600" },
  canceled: { label: "已取消（到期降级）", cls: "bg-orange-100 text-orange-600" },
  onetime: { label: "一次性（支付宝）", cls: "bg-blue-100 text-blue-600" },
  expired: { label: "已过期", cls: "bg-gray-100 text-gray-500" },
  unknown: { label: "状态未知", cls: "bg-gray-100 text-gray-500" },
  free: { label: "免费版", cls: "bg-gray-100 text-gray-500" },
}

function SubStatusBadge({ status }: { status: SubscriptionStatus | null | undefined }) {
  // 免费用户没有订阅状态，显示「-」避免和左边「套餐」列重复
  if (!status || status === "free") return <span className="text-gray-400">-</span>
  const s = SUB_STATUS[status]
  if (!s) return <span className="text-gray-400">-</span>
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
}

const CANCEL_STATUS_OPTIONS = [
  { value: "completed", label: "成功" },
  { value: "failed", label: "失败" },
]

const CRON_TASK_OPTIONS = [
  { value: "expire-sweep", label: "expire-sweep（过期降级）" },
  { value: "reconcile-cancellations", label: "reconcile-cancellations（取消对账）" },
]

const CRON_STATUS_OPTIONS = [
  { value: "processed", label: "成功" },
  { value: "failed", label: "失败" },
]

/** 把 { total } 从任意列表响应里取出来 */
function totalOf(data: unknown): number {
  if (data && typeof data === "object" && "total" in data) {
    const t = (data as { total?: unknown }).total
    if (typeof t === "number") return t
  }
  return 0
}

/** 筛选状态条：共 N 条 + 已筛选 M 项 + 清除全部
 *  ⚠️ 三者统一用 leading-5、都不加竖向 padding：否则「已筛选」胶囊一出现（或消失）
 *  会把这一行撑高/缩矮，页面在筛选前后会跳一下。 */
function FilterStatus({ q, unit }: { q: TableQuery<unknown>; unit: string }) {
  return (
    <div className="flex min-h-6 flex-wrap items-center gap-2 text-xs leading-5">
      <span className="text-text-secondary">
        共 {totalOf(q.data)} 条{unit}
      </span>
      {q.activeCount > 0 ? (
        <>
          <span className="rounded-full bg-accent/10 px-2 font-semibold leading-5 text-accent">
            已筛选 {q.activeCount} 项
          </span>
          <button type="button" onClick={q.clearFilters} className="leading-5 text-red-600 underline">
            清除全部
          </button>
        </>
      ) : null}
    </div>
  )
}

/** 表格内的「暂无 / 加载中 / 出错」提示行。
 *
 *  ⚠️ 不能用「整张表换成一段提示文字」的写法：筛到 0 条时表头会跟着消失，
 *  连带表头上的筛选按钮一起被卸载 —— 用户就没法改条件了，看起来像「输到一半面板自己关了」。
 *  colSpan 给 99：浏览器会把超出实际列数的 colspan 夹到真实列数，所以不必逐张表数列。
 */
function EmptyRow({ q, text }: { q: TableQuery<unknown>; text: string }) {
  const msg = q.error ? q.error : q.loading ? "加载中…" : text
  return (
    <tr>
      <td
        colSpan={99}
        className={`px-4 py-12 text-center text-sm ${q.error ? "text-red-600" : "text-text-secondary"}`}
      >
        {msg}
      </td>
    </tr>
  )
}

// ── 页面 ──

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("orders")

  // 六组数据各自独立分页 + 筛选；全都在这里调用，
  // 这样切 tab 不会丢筛选状态，且每个 tab 的角标随时能读到全局数
  const ordersQ = useTableQuery<OrdersResponse>("/api/admin/orders")
  const webhooksQ = useTableQuery<WebhookLogsResponse>("/api/admin/webhook-logs")
  const cancelsQ = useTableQuery<CancelLogsResponse>("/api/admin/cancel-logs")
  const usersQ = useTableQuery<UsersResponse>("/api/admin/users")
  const cronsQ = useTableQuery<CronLogsResponse>("/api/admin/cron-logs")
  const configQ = useTableQuery<ConfigResponse>("/api/admin/config")

  const all = [ordersQ, webhooksQ, cancelsQ, usersQ, cronsQ, configQ]
  const pending = all.some((q) => q.loading && q.data === null && !q.error)
  const anyLoading = all.some((q) => q.loading)
  const firstError = all.find((q) => q.error && q.data === null)

  const refresh = useCallback(() => {
    for (const q of [ordersQ, webhooksQ, cancelsQ, usersQ, cronsQ, configQ]) q.reload()
  }, [ordersQ, webhooksQ, cancelsQ, usersQ, cronsQ, configQ])

  if (pending) {
    return <div className="text-center py-16 text-text-secondary">加载中…</div>
  }

  if (firstError) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">{firstError.error}</p>
          <p className="text-text-secondary text-sm mt-2">
            无权限访问此页面，仅限管理员使用。
          </p>
        </div>
      </div>
    )
  }

  // 角标规则：有异常 → 红色显示异常数；无异常 → 灰色显示总数。
  // 异常数取「全量」口径（不受当前筛选影响），否则一筛选就看不到真问题了。
  const badge = (anomaly: number | undefined, allCount: number | undefined) => {
    const a = anomaly ?? 0
    return a > 0 ? { n: a, red: true } : { n: allCount ?? 0, red: false }
  }

  const tabs: Array<{ key: Tab; label: string; n?: number; red?: boolean }> = [
    { key: "orders", label: "订单列表", ...badge(ordersQ.data?.mismatchCount, ordersQ.data?.totalAll) },
    { key: "webhooks", label: "回调流水", ...badge(webhooksQ.data?.failedAll, webhooksQ.data?.totalAll) },
    { key: "cancels", label: "取消审计", ...badge(cancelsQ.data?.failedAll, cancelsQ.data?.totalAll) },
    { key: "users", label: "用户列表", ...badge(undefined, usersQ.data?.totalAll) },
    { key: "crons", label: "Cron 日志", ...badge(cronsQ.data?.failedAll, cronsQ.data?.totalAll) },
    { key: "config", label: "系统配置" },
  ]

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">支付后台</h1>
          <p className="text-text-secondary text-sm mt-1">
            订单 / 回调流水 / 取消审计 / 用户 / Cron 日志 / 系统配置 —— 统一查看。每页 50 条，点列头漏斗即可筛选。
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={anyLoading}
          className="px-4 py-2 rounded-xl border border-gray-200 text-text-secondary text-sm hover:bg-gray-50 disabled:opacity-50 shrink-0"
        >
          {anyLoading ? "刷新中…" : "刷新"}
        </button>
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
            {t.n !== undefined && t.n > 0 && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  t.red ? "bg-red-100 text-red-600" : "bg-surface text-text-secondary"
                }`}
              >
                {t.n}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "orders" && <OrdersTab q={ordersQ} />}
      {tab === "webhooks" && <WebhooksTab q={webhooksQ} />}
      {tab === "cancels" && <CancelsTab q={cancelsQ} />}
      {tab === "users" && <UsersTab q={usersQ} />}
      {tab === "crons" && <CronsTab q={cronsQ} />}
      {tab === "config" && <ConfigTab data={configQ.data} />}
    </div>
  )
}

// ── Tab 1：订单列表 ──

function OrdersTab({ q }: { q: TableQuery<OrdersResponse> }) {
  const orders = q.data?.orders ?? []
  const mismatch = q.data?.mismatchCount ?? 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="筛选结果" value={q.data?.total ?? 0} tone="gray" />
        <StatCard label="已支付" value={q.data?.paidCount ?? 0} tone="green" />
        <StatCard label="Creem 收入" value={fmtAmount(q.data?.creemRevenue ?? 0, "USD")} tone="amber" />
        <StatCard
          label="支付宝收入"
          value={fmtAmount(q.data?.alipayRevenue ?? 0, "CNY")}
          tone="amber"
        />
      </div>

      {mismatch > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <span className="font-semibold">⚠ 金额异常 {mismatch} 笔</span>
          <span className="text-red-600">
            实付金额与应收金额不一致，已在下方表格标红。请核对支付渠道后台价格与代码定价常量。
          </span>
        </div>
      )}

      <FilterStatus q={q} unit="订单" />

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-text-secondary">
              <tr>
                <Th
                  label="时间"
                  hint="订单创建时间"
                  filter={{ type: "date" }}
                  value={q.filters.createdAt}
                  onChange={(v) => q.setFilter("createdAt", v)}
                />
                <Th
                  label="用户邮箱"
                  hint="下单用户的邮箱"
                  filter={{ type: "text", placeholder: "如 gmail.com" }}
                  value={q.filters.email}
                  onChange={(v) => q.setFilter("email", v)}
                />
                <Th
                  label="订单号"
                  hint="Creem / 支付宝生成的订单号"
                  filter={{ type: "text", placeholder: "如 ord_" }}
                  value={q.filters.orderId}
                  onChange={(v) => q.setFilter("orderId", v)}
                />
                <Th
                  label="渠道"
                  hint="支付渠道：creem 或 alipay"
                  filter={{ type: "select", options: CHANNEL_OPTIONS }}
                  value={q.filters.channel}
                  onChange={(v) => q.setFilter("channel", v)}
                />
                <Th
                  label="周期"
                  hint="订阅周期：月付 / 年付"
                  filter={{ type: "select", options: PERIOD_OPTIONS }}
                  value={q.filters.period}
                  onChange={(v) => q.setFilter("period", v)}
                />
                <Th
                  label="应收金额"
                  align="right"
                  hint="网站应收金额（下单时按定价常量写入）"
                />
                <Th
                  label="实付金额"
                  align="right"
                  hint="支付平台回调的实付金额（未支付为 -）；与应收不一致时标红"
                />
                <Th
                  label="状态"
                  hint="订单状态：待支付 / 已支付 / 已取消 / 已退款 / 已过期"
                  filter={{ type: "select", options: ORDER_STATUS_OPTIONS }}
                  value={q.filters.status}
                  onChange={(v) => q.setFilter("status", v)}
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className={o.status === "PAID" ? "" : "opacity-60"}>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtTime(o.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{o.userEmail ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{o.orderId}</td>
                  <td className="px-4 py-3">
                    <ChannelCell channel={o.channel} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{fmtPeriod(o.period)}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium text-right tabular-nums">
                    {fmtAmount(o.amount, o.currency)}
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-right tabular-nums">
                    {o.paidAmount == null ? (
                      <span className="text-gray-400">-</span>
                    ) : isAmountMismatch(o) ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold tabular-nums"
                        title={`实付与应收不一致 —— 应收 ${fmtAmount(o.amount, o.currency)} / 实付 ${fmtAmount(o.paidAmount, o.paidCurrency ?? o.currency)}`}
                      >
                        <span aria-hidden>⚠</span>
                        {fmtAmount(o.paidAmount, o.paidCurrency ?? o.currency)}
                      </span>
                    ) : (
                      <span className="text-gray-700">
                        {fmtAmount(o.paidAmount, o.paidCurrency ?? o.currency)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <EmptyRow q={q} text="暂无订单" />}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={q.page}
          pageSize={q.pageSize}
          total={q.data?.total ?? 0}
          onPageChange={q.setPage}
        />
      </div>
    </div>
  )
}

// ── Tab 2：回调流水 ──

function WebhooksTab({ q }: { q: TableQuery<WebhookLogsResponse> }) {
  const logs = q.data?.logs ?? []
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">
        记录支付渠道（Creem / 支付宝）推送的每一次 webhook 通知。状态「失败」= 已收到但未处理成功，
        可能导致用户付款后未升级，需人工核对。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="筛选结果" value={q.data?.total ?? 0} tone="gray" />
        <StatCard
          label="失败回调"
          value={q.data?.failed ?? 0}
          tone={(q.data?.failed ?? 0) > 0 ? "red" : "gray"}
        />
      </div>

      <FilterStatus q={q} unit="回调" />

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-text-secondary">
              <tr>
                <Th
                  label="时间"
                  hint="回调到达时间"
                  filter={{ type: "date" }}
                  value={q.filters.createdAt}
                  onChange={(v) => q.setFilter("createdAt", v)}
                />
                <Th
                  label="来源"
                  hint="回调来源渠道（creem / alipay）"
                  filter={{ type: "select", options: CHANNEL_OPTIONS }}
                  value={q.filters.source}
                  onChange={(v) => q.setFilter("source", v)}
                />
                <Th
                  label="事件"
                  hint="渠道事件类型（列表显示中文，悬浮显示英文原文）"
                  filter={{ type: "select", options: EVENT_OPTIONS }}
                  value={q.filters.eventType}
                  onChange={(v) => q.setFilter("eventType", v)}
                />
                <Th
                  label="状态"
                  hint="本条回调的处理结果（列表显示中文，悬浮显示英文原文）"
                  filter={{ type: "select", options: WEBHOOK_STATUS_OPTIONS }}
                  value={q.filters.status}
                  onChange={(v) => q.setFilter("status", v)}
                />
                <Th
                  label="用户"
                  hint="触发此回调的用户邮箱"
                  filter={{ type: "text", placeholder: "如 gmail.com" }}
                  value={q.filters.email}
                  onChange={(v) => q.setFilter("email", v)}
                />
                <Th
                  label="订阅ID"
                  hint="Creem 订阅ID（sub_xxx）"
                  filter={{ type: "text", placeholder: "如 sub_" }}
                  value={q.filters.subscriptionId}
                  onChange={(v) => q.setFilter("subscriptionId", v)}
                />
                <Th
                  label="事件ID"
                  hint="Creem 事件唯一标识（evt_xxx），用于去重"
                  filter={{ type: "text", placeholder: "如 evt_" }}
                  value={q.filters.eventId}
                  onChange={(v) => q.setFilter("eventId", v)}
                />
                <th className="text-left px-4 py-3 font-medium" title="回调原始请求体 JSON">
                  原文
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((l) => (
                <tr
                  key={l.id}
                  className={
                    l.status.startsWith("failed") || l.status === "processed:amount-mismatch"
                      ? "bg-red-50/50"
                      : ""
                  }
                >
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtTime(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <ChannelCell channel={l.source} />
                  </td>
                  <td className="px-4 py-3">
                    <WebhookEventCell eventType={l.eventType} />
                  </td>
                  <td className="px-4 py-3">
                    <WebhookStatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                    {l.userEmail ?? (l.userId ? l.userId.slice(0, 8) + "…" : "-")}
                  </td>
                  <td
                    className="px-4 py-3 text-gray-700 font-mono text-xs max-w-[120px] truncate"
                    title={l.subscriptionId ?? ""}
                  >
                    {l.subscriptionId ?? "-"}
                  </td>
                  <td
                    className="px-4 py-3 text-gray-700 font-mono text-xs max-w-[160px] truncate"
                    title={l.eventId ?? ""}
                  >
                    {l.eventId ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {l.rawPreview ? (
                      <button
                        type="button"
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
              {logs.length === 0 && <EmptyRow q={q} text="暂无回调记录" />}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={q.page}
          pageSize={q.pageSize}
          total={q.data?.total ?? 0}
          onPageChange={q.setPage}
        />
      </div>
    </div>
  )
}

// ── Tab 3：取消审计 ──

function CancelsTab({ q }: { q: TableQuery<CancelLogsResponse> }) {
  const logs = q.data?.logs ?? []

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">
        记录每一次「取消订阅」尝试。状态为「失败」= 上游（Creem）没取消成功，
        需去 Creem 后台补刀，或让用户重新点一次「取消」。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="失败取消"
          value={q.data?.failed ?? 0}
          tone={(q.data?.failed ?? 0) > 0 ? "red" : "gray"}
        />
        <StatCard label="成功取消" value={q.data?.completed ?? 0} tone="green" />
        <StatCard label="筛选结果" value={q.data?.total ?? 0} tone="gray" />
      </div>

      <FilterStatus q={q} unit="记录" />

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-text-secondary">
              <tr>
                <Th
                  label="时间"
                  hint="取消操作时间"
                  filter={{ type: "date" }}
                  value={q.filters.createdAt}
                  onChange={(v) => q.setFilter("createdAt", v)}
                />
                <Th
                  label="渠道"
                  hint="支付渠道（目前只有 creem 有订阅可取消）"
                  filter={{ type: "select", options: CHANNEL_OPTIONS }}
                  value={q.filters.channel}
                  onChange={(v) => q.setFilter("channel", v)}
                />
                <Th
                  label="状态"
                  hint="成功 = Creem 已确认取消；失败 = 上游拒绝"
                  filter={{ type: "select", options: CANCEL_STATUS_OPTIONS }}
                  value={q.filters.status}
                  onChange={(v) => q.setFilter("status", v)}
                />
                <Th
                  label="用户"
                  hint="发起取消的用户邮箱（悬浮可看用户ID）"
                  filter={{ type: "text", placeholder: "如 gmail.com" }}
                  value={q.filters.email}
                  onChange={(v) => q.setFilter("email", v)}
                />
                <Th
                  label="订阅ID"
                  hint="Creem 订阅ID（sub_xxx）"
                  filter={{ type: "text", placeholder: "如 sub_" }}
                  value={q.filters.subscriptionId}
                  onChange={(v) => q.setFilter("subscriptionId", v)}
                />
                <Th
                  label="错误"
                  hint="失败时的错误信息（该列暂不支持筛选）"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((l) => (
                <tr key={l.id} className={l.status === "failed" ? "bg-red-50/50" : ""}>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtTime(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <ChannelCell channel={l.channel} />
                  </td>
                  <td className="px-4 py-3">
                    {l.status === "failed" ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                        失败
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
                        成功
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                    <span title={l.userId ?? ""}>{l.userEmail ?? "-"}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                    {l.subscriptionId ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-red-600 text-xs max-w-xs break-words">
                    {l.error || "-"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <EmptyRow q={q} text="✅ 暂无取消记录" />}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={q.page}
          pageSize={q.pageSize}
          total={q.data?.total ?? 0}
          onPageChange={q.setPage}
        />
      </div>
    </div>
  )
}

// ── Tab 4：用户列表 ──

function UsersTab({ q }: { q: TableQuery<UsersResponse> }) {
  const users = q.data?.users ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="筛选结果" value={q.data?.total ?? 0} tone="gray" />
        <StatCard label="Pro 用户" value={q.data?.proCount ?? 0} tone="green" />
        <StatCard label="免费用户" value={q.data?.freeCount ?? 0} tone="gray" />
      </div>

      <FilterStatus q={q} unit="用户" />

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-text-secondary">
              <tr>
                <Th
                  label="注册时间"
                  hint="用户注册时间"
                  filter={{ type: "date" }}
                  value={q.filters.createdAt}
                  onChange={(v) => q.setFilter("createdAt", v)}
                />
                <Th
                  label="邮箱"
                  hint="注册邮箱"
                  filter={{ type: "text", placeholder: "如 gmail.com" }}
                  value={q.filters.email}
                  onChange={(v) => q.setFilter("email", v)}
                />
                <Th
                  label="用户名"
                  hint="用户昵称"
                  filter={{ type: "text", placeholder: "昵称关键字" }}
                  value={q.filters.name}
                  onChange={(v) => q.setFilter("name", v)}
                />
                    <Th
                      label="套餐"
                      hint="当前套餐：FREE 免费版 / PRO 付费版"
                      filter={{ type: "select", options: TIER_OPTIONS }}
                      value={q.filters.tier}
                      onChange={(v) => q.setFilter("tier", v)}
                    />
                    <Th
                      label="订阅状态"
                      hint="订阅中=Creem 自动续费；已取消=取消后到期降级；一次性=支付宝买断（不算取消）"
                    />
                <Th label="到期时间" hint="付费到期时间（FREE 用户为空）" />
                <Th label="订单数" align="right" hint="该用户创建的订单总数" />
                <Th label="引导完成" hint="新用户引导是否完成" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtTime(u.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{u.email ?? u.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{u.name ?? "-"}</td>
                      <td className="px-4 py-3">
                        {u.subscriptionTier === SUBSCRIPTION_TIER.PRO ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-xs font-semibold">
                            Pro
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <SubStatusBadge status={u.subStatus} />
                      </td>
                  <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                    {u.subscriptionExpiryDate ? fmtTime(u.subscriptionExpiryDate) : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-right tabular-nums">{u.orderCount}</td>
                  <td className="px-4 py-3 text-gray-700">{u.onboardingCompleted ? "✅" : "—"}</td>
                </tr>
              ))}
              {users.length === 0 && <EmptyRow q={q} text="暂无用户" />}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={q.page}
          pageSize={q.pageSize}
          total={q.data?.total ?? 0}
          onPageChange={q.setPage}
        />
      </div>
    </div>
  )
}

// ── Tab 5：Cron 日志 ──

function CronsTab({ q }: { q: TableQuery<CronLogsResponse> }) {
  const logs = q.data?.logs ?? []

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">
        Vercel Cron 定时任务执行记录（每日 00:00 过期降级 / 01:00 取消对账，UTC 时间；对应北京时间 08:00 / 09:00）。
        状态为「失败」= 定时任务执行出错，需检查服务端日志。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="筛选结果" value={q.data?.total ?? 0} tone="gray" />
        <StatCard
          label="失败执行"
          value={q.data?.failed ?? 0}
          tone={(q.data?.failed ?? 0) > 0 ? "red" : "gray"}
        />
      </div>

      <FilterStatus q={q} unit="记录" />

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-text-secondary">
              <tr>
                <Th
                  label="执行时间"
                  hint="Cron 任务执行时间"
                  filter={{ type: "date" }}
                  value={q.filters.createdAt}
                  onChange={(v) => q.setFilter("createdAt", v)}
                />
                <Th
                  label="任务"
                  hint="expire-sweep 过期降级 / reconcile-cancellations 取消对账"
                  filter={{ type: "select", options: CRON_TASK_OPTIONS }}
                  value={q.filters.task}
                  onChange={(v) => q.setFilter("task", v)}
                />
                <Th
                  label="状态"
                  hint="执行结果：成功 / 失败"
                  filter={{ type: "select", options: CRON_STATUS_OPTIONS }}
                  value={q.filters.status}
                  onChange={(v) => q.setFilter("status", v)}
                />
                <Th label="详情" hint="处理详情：受影响的用户数、失败数等" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((l) => (
                <tr key={l.id} className={l.status === "failed" ? "bg-red-50/50" : ""}>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtTime(l.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{l.eventType ?? "-"}</td>
                  <td className="px-4 py-3">
                    {l.status === "failed" ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                        失败
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
                        成功
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs max-w-md break-words">
                    <pre className="whitespace-pre-wrap break-all font-mono text-xs">
                      {JSON.stringify(l.detail)}
                    </pre>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <EmptyRow q={q} text="暂无 Cron 执行记录（部署后每日自动执行，执行时写入）" />}
            </tbody>
          </table>
        </div>
        <DataTablePagination
          page={q.page}
          pageSize={q.pageSize}
          total={q.data?.total ?? 0}
          onPageChange={q.setPage}
        />
      </div>
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
      <p className={`text-3xl font-bold mt-1 tabular-nums ${toneClass}`}>{value}</p>
    </div>
  )
}

// 渠道/来源单元格：官方 logo + 中文名（图标与名称统一取自 shared/constants/payment-channels，
// 本文件不重新定义渠道图标）。未收录的渠道回退显示原始英文名。
function ChannelCell({ channel }: { channel: string | null | undefined }) {
  if (!channel) return <span className="text-gray-400">-</span>
  const icon = CHANNEL_ICONS[channel]
  const label = CHANNEL_LABELS[channel] ?? channel
  return (
    <span className="inline-flex items-center gap-1.5 text-gray-700" title={label}>
      {icon ? <span className="w-4 h-4 shrink-0" dangerouslySetInnerHTML={{ __html: icon }} /> : null}
      <span className="whitespace-nowrap">{label}</span>
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "PAID") {
    return <span className="inline-flex px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-semibold">已支付</span>
  }
  if (status === "PENDING") {
    return <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-xs font-semibold">待支付</span>
  }
  if (status === "CANCELED") {
    return <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">已取消</span>
  }
  if (status === "EXPIRED") {
    return <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">已过期</span>
  }
  if (status === "REFUNDED") {
    return <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">已退款</span>
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
    "processed:amount-mismatch": "金额不一致",
    "failed:amount-mismatch": "金额不一致",
    "failed:amount-unknown": "金额无法匹配",
    "failed:order-not-found": "订单不存在",
    "failed:no-public-key": "未配置公钥",
    "failed:no-out-trade-no": "缺少订单号",
    "failed:appid": "应用ID不符",
  }
  const tone: Record<string, string> = {
    received: "bg-amber-100 text-amber-600",
    processed: "bg-green-100 text-green-600",
    duplicate: "bg-amber-100 text-amber-700",
    ignored: "bg-gray-100 text-gray-500",
    // 金额不一致虽属"已处理"，但必须用警示色（否则红/灰难辨，告警会被漏看）
    "processed:amount-mismatch": "bg-red-100 text-red-600",
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

// ── Tab 6：系统配置 ──

const TONE_STYLE: Record<AiTone, string> = {
  ok: "bg-green-100 text-green-700",
  warn: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-700",
  plain: "bg-gray-100 text-gray-700",
}

const TONE_ICON: Record<AiTone, string> = {
  ok: "✓",
  warn: "⚠",
  error: "✗",
  plain: "",
}

interface ConfigRowSpec {
  label: string
  value: string
  required?: boolean
  tone?: AiTone
  tag?: string
  /** 环境变量原名，点击即复制，方便直接去 Vercel 粘贴 */
  env?: string
  /** 字段说明：默认隐藏，由顶部「显示说明」开关控制；ⓘ 图标可随时单独查看 */
  desc?: string
}

/** 环境变量名，点击复制。「已复制」悬浮在按钮外侧，避免把按钮撑宽导致换行 */
function EnvName({ env, href }: { env: string; href?: string | null }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(env)
    } catch {
      // 剪贴板不可用时静默降级，不打断页面
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={copy}
        className="px-1 rounded font-mono text-[11px] text-gray-400 whitespace-nowrap hover:bg-gray-200 hover:text-gray-600"
      >
        {env}
      </button>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          title={`在 Vercel 查看 ${env}`}
          className="ml-1 text-[11px] text-accent hover:underline"
        >
          ↗
        </a>
      ) : null}
      {copied ? (
        <span className="absolute left-full top-1/2 ml-1.5 -translate-y-1/2 whitespace-nowrap text-[11px] text-green-600">
          已复制
        </span>
      ) : null}
    </span>
  )
}

/**
 * 配置行。
 * - 显式传 tone 时按 tone 渲染状态色（AI 区块用，支持「回退默认」这类中间态）
 * - 不传 tone 时沿用原有的「已配置 / 未配置」字符串判断，支付等既有行不受影响
 * - tag：值后面挂的灰色小标签，用于标注「默认」等来源信息
 * - env：环境变量名（可复制）；desc：字段说明（受顶部开关控制，ⓘ 可单独查看）
 */
function ConfigRow({ label, value, required, tone, tag, env, desc, showDesc, envBaseUrl }: ConfigRowSpec & {
  showDesc: boolean
  envBaseUrl?: string | null
}) {
  const inferred: AiTone | null = tone ?? (value === "已配置" ? "ok" : value === "未配置" ? "error" : null)
  const isMissing = inferred === "error"
  const muted = tag ? "text-text-secondary" : ""
  // 说明气泡：鼠标停在标题上 0.5 秒才显示（避免鼠标扫过就闪），移开立即消失。
  // 点按同样支持（触屏）。用 fixed 定位，避免被卡片 overflow-hidden 裁切。
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null)
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelTip = () => {
    if (tipTimer.current) {
      clearTimeout(tipTimer.current)
      tipTimer.current = null
    }
  }
  const showTip = (r: DOMRect) => {
    cancelTip()
    tipTimer.current = setTimeout(() => {
      setTip({ top: r.bottom + 8, left: Math.max(12, Math.min(r.left, window.innerWidth - 280)) })
    }, 500)
  }
  const hideTip = () => {
    cancelTip()
    setTip(null)
  }
  const toggleTip = (r: DOMRect) => (tip ? hideTip() : showTip(r))
  return (
    <div className={`flex items-center px-4 py-2.5 border-t border-gray-100 ${isMissing && required ? "bg-red-50/50" : ""}`}>
      <div className="w-[210px] shrink-0 pr-3">
        <div
          className="text-gray-700 font-medium text-sm whitespace-nowrap"
          onMouseEnter={(e) => (desc ? showTip(e.currentTarget.getBoundingClientRect()) : undefined)}
          onMouseLeave={hideTip}
          onClick={(e) => (desc ? toggleTip(e.currentTarget.getBoundingClientRect()) : undefined)}
        >
          {label}{required ? <span className="text-red-500 ml-0.5">*</span> : ""}
        </div>
        {env ? (
          <EnvName
            env={env}
            href={envBaseUrl ? `${envBaseUrl}?q=${encodeURIComponent(env)}` : null}
          />
        ) : null}
        {desc && showDesc ? <div className="mt-1 text-[12px] leading-snug text-gray-500">{desc}</div> : null}
      </div>
      <div className="flex-1 min-w-0 text-sm">
        {inferred ? (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${TONE_STYLE[inferred]}`}>
            {TONE_ICON[inferred] ? TONE_ICON[inferred] + " " : ""}{value}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span className={`font-mono text-xs break-all ${muted}`}>{value}</span>
            {tag ? <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] shrink-0">{tag}</span> : null}
          </span>
        )}
      </div>
      {tip && desc ? (
        <span
          className="fixed z-50 max-w-[260px] rounded-lg bg-gray-800 px-2.5 py-1.5 text-[11px] leading-snug text-white"
          style={{ top: tip.top, left: tip.left }}
        >
          {desc}
        </span>
      ) : null}
    </div>
  )
}

/** 字段说明抽屉：说明集中展示，支持按标签 / 变量名 / 说明全文搜索 */
function ConfigHelpDrawer({ sections, open, onClose }: {
  sections: { title: string; rows: ConfigRowSpec[] }[]
  open: boolean
  onClose: () => void
}) {
  const [q, setQ] = useState("")
  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return sections
      .map((s) => ({
        title: s.title,
        rows: kw
          ? s.rows.filter((r) => `${r.label} ${r.env ?? ""} ${r.desc ?? ""}`.toLowerCase().includes(kw))
          : s.rows,
      }))
      .filter((s) => s.rows.length > 0)
  }, [sections, q])

  if (!open) return null
  const total = filtered.reduce((n, s) => n + s.rows.length, 0)

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="absolute right-0 top-0 bottom-0 flex w-[400px] max-w-[92vw] flex-col border-l border-gray-200 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text-primary">字段说明</span>
            <button type="button" onClick={onClose} className="text-lg leading-none text-gray-400">×</button>
          </div>
          <p className="mt-1 text-[12px] text-gray-500">共 {total} 个字段，可按标签 / 变量名 / 说明搜索</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索，例如：域名 / CREEM / 对账"
            className="mt-2 w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {filtered.map((s) => (
            <div key={s.title}>
              <p className="mt-4 mb-1 text-[12px] text-gray-400">{s.title}</p>
              {s.rows.map((r) => (
                <div key={r.label + (r.env ?? "")} className="border-t border-gray-100 py-2">
                  <p className="text-[13px] font-medium text-text-primary">{r.label}</p>
                  {r.env ? <p className="font-mono text-[11px] text-gray-500">{r.env}</p> : null}
                  {r.desc ? <p className="mt-1 text-[12px] text-gray-500">{r.desc}</p> : null}
                </div>
              ))}
            </div>
          ))}
          {total === 0 ? <p className="py-6 text-center text-[13px] text-gray-400">没有匹配的字段</p> : null}
        </div>
      </div>
    </div>
  )
}

function ConfigTab({ data }: { data: ConfigResponse | null }) {
  // 说明默认收起；上次的选择记在 localStorage（惰性初始化，避免在 effect 里 setState 触发级联渲染）
  const [showDesc, setShowDesc] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      return localStorage.getItem("admin-config-show-desc") === "1"
    } catch {
      return false
    }
  })
  const [helpOpen, setHelpOpen] = useState(false)

  function toggleDesc() {
    setShowDesc((v) => {
      const next = !v
      try {
        localStorage.setItem("admin-config-show-desc", next ? "1" : "0")
      } catch {
        // 忽略写入失败
      }
      return next
    })
  }

  const c = data?.config
  if (!c) {
    return <div className="text-center py-16 text-text-secondary">无法加载配置</div>
  }

  const sections: { title: string; note?: string; rows: ConfigRowSpec[] }[] = [
    {
      title: "应用",
      rows: [
        {
          label: "应用地址",
          env: "NEXT_PUBLIC_APP_URL",
          desc: "网站正式域名，支付回调和邮件里的链接都用它拼接",
          value: c.app.url,
        },
      ],
    },
    {
      title: "数据库",
      rows: [
        {
          label: "直连 URL",
          env: "DIRECT_URL",
          desc: "数据库直连地址，Vercel 构建时执行迁移用",
          required: true,
          value: c.database.directUrl,
        },
      ],
    },
    {
      title: "Cron 定时任务",
      rows: [
        {
          label: "定时任务令牌",
          env: "CRON_SECRET",
          desc: "订阅降级、取消对账这两个每日定时任务的访问令牌，防止被乱调用",
          required: true,
          value: c.cron.cronSecret,
        },
      ],
    },
    {
      title: "账号与权限",
      rows: [
        {
          label: "会话加密密钥",
          env: "AUTH_SECRET",
          desc: "登录会话的加密密钥，随机长字符串",
          required: true,
          value: c.auth.authSecret,
        },
        {
          label: "管理员邮箱",
          env: "ADMIN_EMAILS",
          desc: "管理员邮箱白名单，命中的邮箱才能进后台",
          value: c.auth.adminEmails,
        },
      ],
    },
    {
      title: "登录方式（OAuth）",
      rows: [
        {
          label: "Google Client ID",
          env: "AUTH_GOOGLE_ID",
          desc: "Google 登录用的应用 ID，Google Cloud 后台创建",
          value: c.oauth.googleId,
        },
        {
          label: "Google Client 密钥",
          env: "AUTH_GOOGLE_SECRET",
          desc: "Google 登录用的应用密钥，和上面那个 ID 配对",
          value: c.oauth.googleSecret,
        },
        {
          label: "GitHub Client ID",
          env: "AUTH_GITHUB_ID",
          desc: "GitHub 登录用的应用 ID，GitHub 后台创建",
          value: c.oauth.githubId,
        },
        {
          label: "GitHub Client 密钥",
          env: "AUTH_GITHUB_SECRET",
          desc: "GitHub 登录用的应用密钥，和上面那个 ID 配对",
          value: c.oauth.githubSecret,
        },
      ],
    },
    {
      title: "Creem 支付",
      rows: [
        {
          label: "API Key",
          env: "CREEM_API_KEY",
          desc: "Creem 平台密钥，创建收银台会话用",
          required: true,
          value: c.creem.apiKey,
        },
        {
          label: "Webhook 密钥",
          env: "CREEM_WEBHOOK_SECRET",
          desc: "校验 Creem 回调请求的签名，防伪造通知",
          required: true,
          value: c.creem.webhookSecret,
        },
        {
          label: "月付产品 ID",
          env: "CREEM_MONTHLY_PRODUCT_ID",
          desc: "Creem 后台创建的月付订阅产品 ID",
          required: true,
          value: c.creem.monthlyProductId,
        },
        {
          label: "年付产品 ID",
          env: "CREEM_ANNUAL_PRODUCT_ID",
          desc: "Creem 后台创建的年付订阅产品 ID",
          required: true,
          value: c.creem.annualProductId,
        },
      ],
    },
    {
      title: "支付宝",
      note: "登录和支付共用这组配置",
      rows: [
        {
          label: "App ID",
          env: "AUTH_ALIPAY_ID",
          desc: "支付宝开放平台分配的应用 ID",
          value: c.alipay.appId,
        },
        {
          label: "私钥",
          env: "AUTH_ALIPAY_PRIVATE_KEY",
          desc: "应用私钥，向支付宝发请求时用来签名",
          value: c.alipay.privateKey,
        },
        {
          label: "公钥",
          env: "AUTH_ALIPAY_PUBLIC_KEY",
          desc: "支付宝公钥，用来验证回调通知是不是支付宝发的",
          value: c.alipay.publicKey,
        },
      ],
    },
    {
      title: "AI 服务（按订阅层级分流）",
      rows: [
        {
          label: "免费版 来源",
          desc: "根据专用 Key 是否配置自动判断，无对应变量",
          value: c.ai.free.source.text,
          tone: c.ai.free.source.tone,
        },
        {
          label: "免费版 专用 Key",
          env: "AI_API_KEY_FREE",
          desc: "免费版专用的 AI 服务密钥",
          value: c.ai.free.key.text,
          tone: c.ai.free.key.tone,
        },
        {
          label: "免费版 模型",
          env: "AI_MODEL_FREE",
          desc: "免费版 AI 请求使用的模型名",
          value: c.ai.free.model.text,
          tag: c.ai.free.model.fromDefault ? "默认" : undefined,
        },
        {
          label: "免费版 接口地址",
          env: "AI_BASE_URL_FREE",
          desc: "免费版 AI 服务的接口地址",
          value: c.ai.free.baseUrl.text,
          tag: c.ai.free.baseUrl.fromDefault ? "默认" : undefined,
        },
        {
          label: "付费版 来源",
          desc: "根据专用 Key 是否配置自动判断，无对应变量",
          value: c.ai.pro.source.text,
          tone: c.ai.pro.source.tone,
        },
        {
          label: "付费版 专用 Key",
          env: "AI_API_KEY_PRO",
          desc: "付费版专用的 AI 服务密钥",
          value: c.ai.pro.key.text,
          tone: c.ai.pro.key.tone,
        },
        {
          label: "付费版 模型",
          env: "AI_MODEL_PRO",
          desc: "付费版 AI 请求使用的模型名",
          value: c.ai.pro.model.text,
          tag: c.ai.pro.model.fromDefault ? "默认" : undefined,
        },
        {
          label: "付费版 接口地址",
          env: "AI_BASE_URL_PRO",
          desc: "付费版 AI 服务的接口地址",
          value: c.ai.pro.baseUrl.text,
          tag: c.ai.pro.baseUrl.fromDefault ? "默认" : undefined,
        },
        {
          label: "默认兜底 Key",
          env: "AI_API_KEY",
          desc: "免费/付费版都没配专用 Key 时的兜底密钥",
          value: c.ai.fallback.key.text,
          tone: c.ai.fallback.key.tone,
        },
        {
          label: "默认兜底 模型",
          env: "AI_MODEL",
          desc: "兜底请求使用的模型名",
          value: c.ai.fallback.model.text,
        },
        {
          label: "默认兜底 接口地址",
          env: "AI_BASE_URL",
          desc: "兜底请求使用的接口地址",
          value: c.ai.fallback.baseUrl.text,
        },
      ],
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-text-secondary text-sm">
          生产环境配置核对（只显示是否已配置，不暴露密钥原文）。带 * 为必填项，标红「未配置」会导致对应功能不可用。
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleDesc}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${showDesc ? "border-accent/60 bg-orange-50 text-accent" : "border-gray-300 text-gray-600"}`}
        >
          <span className={`relative inline-flex h-[18px] w-[32px] items-center rounded-full ${showDesc ? "bg-accent" : "bg-gray-300"}`}>
            <span className={`absolute h-[14px] w-[14px] rounded-full bg-white transition-transform ${showDesc ? "translate-x-[16px]" : "translate-x-[2px]"}`} />
          </span>
          {showDesc ? "隐藏说明" : "显示说明"}
        </button>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600"
          >
            字段说明（可搜索）
          </button>
        </div>
      </div>
      {c.vercelSlugMissing ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          没取到项目 slug，跳转入口已隐藏：请在 Vercel 项目设置里开启 System Environment Variables，
          或手动配置环境变量 VERCEL_PROJECT_SLUG（值为项目 slug，如 cookmate）。
        </p>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 bg-gray-50 px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-text-primary">
                {s.title}
                {s.note ? <span className="ml-2 text-[12px] font-normal text-gray-400">{s.note}</span> : null}
              </h3>
            </div>
            <div>
              {s.rows.map((r) => (
                <ConfigRow
                  key={r.label}
                  label={r.label}
                  value={r.value}
                  required={r.required}
                  tone={r.tone}
                  tag={r.tag}
                  env={r.env}
                  desc={r.desc}
                  showDesc={showDesc}
                  envBaseUrl={c.vercelEnvUrl}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <ConfigHelpDrawer sections={sections} open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
