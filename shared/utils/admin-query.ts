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
