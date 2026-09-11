// 后台列表查询参数的解析与金额异常判定 —— 被 apps/web/src/app/api/admin/* 共用。
// 放在 shared/utils 下是因为它是纯函数（无 Next/Prisma 依赖），
// 且 apps/ 下不允许出现 utils/ 目录（见 scripts/check-structure.sh）。

/** 单页最大条数（与 api/recipes 的上限保持一致） */
export const MAX_PAGE_SIZE = 100
/** 单页默认条数 */
export const DEFAULT_PAGE_SIZE = 50

/** 解析 page（从 1 起） */
export function parsePage(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10)
  if (Number.isNaN(n) || n < 1) return 1
  return Math.min(n, 1_000_000)
}

/** 解析 pageSize（夹在 1..MAX_PAGE_SIZE，默认 50） */
export function parsePageSize(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10)
  if (Number.isNaN(n)) return DEFAULT_PAGE_SIZE
  return Math.min(MAX_PAGE_SIZE, Math.max(1, n))
}

/** 解析多选参数（逗号分隔） */
export function parseListParam(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

/** 解析日期区间（前端发 ISO 时间戳），两端都无效时返回 undefined */
export function parseDateRange(
  from: string | null,
  to: string | null,
): { gte?: Date; lte?: Date } | undefined {
  const range: { gte?: Date; lte?: Date } = {}
  if (from) {
    const d = new Date(from)
    if (!Number.isNaN(d.getTime())) range.gte = d
  }
  if (to) {
    const d = new Date(to)
    if (!Number.isNaN(d.getTime())) range.lte = d
  }
  return range.gte || range.lte ? range : undefined
}

/** 金额异常判定：实付存在且（金额不同 或 币种不同）。后台表格标红、角标计数共用同一判定。 */
export function isAmountMismatch(o: {
  amount: number
  currency?: string | null
  paidAmount: number | null
  paidCurrency?: string | null
}): boolean {
  if (o.paidAmount == null) return false
  if (o.paidAmount !== o.amount) return true
  return !!o.paidCurrency && !!o.currency && o.paidCurrency !== o.currency
}

/** 用户订阅状态（后台「用户列表」展示用）。口径对齐 Stripe / Chargebee：active / canceled / expired，一次性买断单列。 */
export type SubscriptionStatus = "active" | "canceled" | "onetime" | "expired" | "free" | "unknown"

/**
 * 判定顺序很重要：
 *  1. 免费 → free（没有订阅状态可言）
 *  2. 有 Creem 订阅ID → active（Creem 是「会不会自动续费」的事实来源）
 *  3. 本地无订阅ID 且到期日已过 → expired（等每日降级任务跑掉）
 *  4. 最后一笔已支付订单是支付宝 → onetime（一次性买断，不是取消）
 *  5. 最后一笔是 Creem → canceled（取消后当前周期用完自动降级）
 *  6. 什么都查不到 → unknown（历史脏数据，不硬猜）
 *
 * ⚠️ 为什么需要 lastPaidChannel：取消订阅后本地会把 creemSubscriptionId 清空，
 * 此时「取消的 Creem 订阅」和「支付宝一次性买断」在 User 表上长得一模一样，只能靠支付渠道区分。
 */
export function deriveSubscriptionStatus(input: {
  isPro: boolean
  creemSubscriptionId: string | null
  subscriptionExpiryDate: Date | string | null
  lastPaidChannel: string | null
  now?: Date
}): SubscriptionStatus {
  if (!input.isPro) return "free"
  if (input.creemSubscriptionId) return "active"
  const expiry = input.subscriptionExpiryDate ? new Date(input.subscriptionExpiryDate) : null
  if (expiry && !Number.isNaN(expiry.getTime()) && expiry.getTime() < (input.now ?? new Date()).getTime()) {
    return "expired"
  }
  if (input.lastPaidChannel === "alipay") return "onetime"
  if (input.lastPaidChannel === "creem") return "canceled"
  return "unknown"
}
