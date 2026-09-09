// 定价配置 — 所有价格在此统一管理
// 单位：分（CNY = 分，USD = 美分）
// 修改价格只需改这里，不用翻 4 个文件

export const PRICING = {
  /** 当前显示在 UI 上的币种，用于生成订单金额 */
  currency: "CNY" as const,

  plans: {
    monthly: {
      cny: { amount: 2900, display: "29" },       // ¥29.00
      usd: { amount: 499, display: "4.99" },        // $4.99
    },
    quarterly: {
      cny: { amount: 7800, display: "78" },       // ¥78.00 (¥26/月)
      usd: { amount: 1299, display: "12.99" },       // $12.99 ($4.33/月)
    },
    semiannual: {
      cny: { amount: 13800, display: "138" },     // ¥138.00 (¥23/月)
      usd: { amount: 2399, display: "23.99" },      // $23.99 ($3.99/月)
    },
    annual: {
      cny: { amount: 19900, display: "199" },     // ¥199.00 (¥16.6/月)
      usd: { amount: 3999, display: "39.99" },       // $39.99 ($3.33/月)
    },
  } as const,

  /** 根据币种和周期获取定价 */
  get(period: "monthly" | "quarterly" | "semiannual" | "annual", currency: "CNY" | "USD" = "CNY") {
    return this.plans[period][currency.toLowerCase() as "cny" | "usd"]
  },
} as const

export type BillingPeriod = keyof typeof PRICING.plans

// ── 自动计算的宣传文案 — 不用手写价格数字 ──

/** 月付价格作为基准，计算各周期的折扣 */
function getMonthlyAmount(currency: "CNY" | "USD") {
  return PRICING.get("monthly", currency).amount
}

/** 折算每月价格（分→元/美元，保留2位小数，末尾0去掉） */
export function getPerMonthDisplay(period: BillingPeriod, currency: "CNY" | "USD"): string {
  const totalMonths: Record<BillingPeriod, number> = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 }
  const amount = PRICING.get(period, currency).amount
  const perMonth = amount / totalMonths[period] / 100
  // toFixed(2) 保留两位小数，再去掉末尾的 .0/.00
  const fixed = perMonth.toFixed(2)
  return fixed.replace(/\.?0+$/, '')
}

/** 省了多少金额（绝对值，分） */
export function getSaveAmount(period: BillingPeriod, currency: "CNY" | "USD"): number {
  const totalMonths: Record<BillingPeriod, number> = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 }
  const monthlyAmount = getMonthlyAmount(currency)
  const periodAmount = PRICING.get(period, currency).amount
  return monthlyAmount * totalMonths[period] - periodAmount
}

/** 省了百分之几（整数） */
export function getSavePercent(period: BillingPeriod, currency: "CNY" | "USD"): number {
  const totalMonths: Record<BillingPeriod, number> = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 }
  const monthlyAmount = getMonthlyAmount(currency)
  const periodAmount = PRICING.get(period, currency).amount
  const fullPrice = monthlyAmount * totalMonths[period]
  if (fullPrice === 0) return 0
  return Math.round((fullPrice - periodAmount) / fullPrice * 100)
}