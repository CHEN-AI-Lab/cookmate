// ─── Subscription Utilities ───
// 订阅相关的辅助函数

import { SUBSCRIPTION_TIER } from "../constants"

/** 检查订阅是否过期，过期自动降级（按日期比较，忽略时分秒） */
export function isExpired(expiryDate: Date): boolean {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setUTCHours(0, 0, 0, 0)
  return now > expiry
}

/**
 * 有效套餐（到期感知）—— **判断「该给哪一档权限」时必须用这个，不要直接读 subscriptionTier 字段**。
 *
 * 为什么需要它：数据库里的 subscriptionTier 由每天 UTC 00:00（北京 08:00）的
 * `/api/cron/expire-sweep` 统一降级，而且该任务**只在正式环境跑**（preview 不触发）。
 * 所以在「到期日已过 → 定时任务跑到」这段窗口里，字段仍然是 PRO，
 * 但用户页面（dashboard 的 checkSubscription）是实时按到期日算的、已经显示免费版了。
 * 两边不一致就会出现「页面说免费、功能照给 PRO」——以前正是这个原因产生过一个线上 bug。
 *
 * 规则：
 *   - FREE（含空值）→ FREE
 *   - 其它付费档（PRO / **FAMILY** / 以后新增的档）：没有到期日视为永久；
 *     有到期日且已过 → FREE；否则**原样返回该档**
 *
 * ⚠️ 绝对不要写成「非 PRO 一律返回 FREE」：openai.ts 的 normalizeTier 明确写着
 * 「PRO / FAMILY 走付费端」，把 FAMILY 当 FREE 会让家庭版用户白丢付费额度。
 */
export function effectiveTier(
  subscriptionTier: string | null | undefined,
  subscriptionExpiryDate: Date | string | null | undefined,
): string {
  const upper = (subscriptionTier ?? "").toUpperCase()
  if (!upper || upper === SUBSCRIPTION_TIER.FREE) return SUBSCRIPTION_TIER.FREE
  if (!subscriptionExpiryDate) return upper
  return isExpired(new Date(subscriptionExpiryDate)) ? SUBSCRIPTION_TIER.FREE : upper
}

/**
 * 是否付费档（非 FREE、且非空）。
 *
 * ⚠️ 判断「是付费还是免费」一律用这个，**不要写 `tier === SUBSCRIPTION_TIER.PRO`** ——
 * SUBSCRIPTION_TIER 除了 FREE / PRO 还有 **FAMILY**，硬比 PRO 会把家庭版当成免费版
 * （`shared/api/openai.ts` 的 normalizeTier 明确写着「PRO / FAMILY 走付费端」）。
 * 展示文案暂沿用现有的 Pro/Free 两档：FAMILY 尚未售卖、中文名也未定，
 * 等要上家庭版时再补 familyPlan 文案与档位名称。
 */
export function isPaidTier(subscriptionTier: string | null | undefined): boolean {
  const upper = (subscriptionTier ?? "").toUpperCase()
  return !!upper && upper !== SUBSCRIPTION_TIER.FREE
}

/**
 * 续费到期日计算（webhook 支付成功 / 兜底授权共用这一份，禁止在各自文件里再复制）。
 *
 * 续费累加：从 max(now, 现有到期日) 起算，再加一个周期。
 * - 首次购买（无到期日 / 已过期）：base = now
 * - 续费（未到期）：base = 现有到期日 → 正确累加，权益不缩水
 *
 * ⚠️ 注意：这里用的是 setUTCMonth(+1) 的朴素写法，月末（29/30/31 日）购买会落到下下月
 *   （例如 1/31 → 3/2），与同文件处理月末的 addMonths() 行为不同。
 *   这是既有线上行为 —— 存量用户的到期日都是这么算出来的，改用 addMonths 会改变他们的到期日，
 *   必须单独评估后再动，不要顺手替换。
 */
export function computeRenewalExpiry(existingExpiry: Date | null, period: string): Date {
  const now = new Date()
  const base = existingExpiry && existingExpiry > now ? existingExpiry : now
  const expiry = new Date(base)
  if (period === "annual") {
    expiry.setUTCFullYear(expiry.getUTCFullYear() + 1)
  } else {
    expiry.setUTCMonth(expiry.getUTCMonth() + 1)
  }
  return expiry
}

/**
 * 给定日期加 N 个月，自动处理月底越界。
 *
 * 例：1月31日 + 1月 → 2月28/29日（不是3月3日）
 * 算法：先尝试 setUTCMonth(month + n)，若结果日 < 原始日（如 Jan 31 → Mar 3，日变成3），
 *      说明溢出了，把日设为目标月最后一天（设为 0 = 上月最后一天）。
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const originalDay = result.getUTCDate()
  result.setUTCMonth(result.getUTCMonth() + months)
  // 月底越界检测：日回退到原始日之前 → 目标月没有这一天
  if (result.getUTCDate() < originalDay) {
    // 回退到目标月最后一天：先设为下月1日，再 -1 天
    result.setUTCDate(0)
  }
  return result
}

/**
 * 给定日期加 N 年，自动处理闰年越界（2月29日 + 1年 → 2月28日）。
 * 实现复用 addMonths(12 * years)，addMonths 已处理月底越界。
 */
export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12)
}