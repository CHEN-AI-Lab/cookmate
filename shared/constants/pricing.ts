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