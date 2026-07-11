// 定价配置 — 所有价格在此统一管理
// 单位：分（CNY = 分，USD = 美分）
// 修改价格只需改这里，不用翻 4 个文件

export const PRICING = {
  /** 当前显示在 UI 上的币种，用于生成订单金额 */
  currency: "CNY" as const,

  plans: {
    monthly: {
      cny: { amount: 2000, display: "20" },       // ¥20.00
      usd: { amount: 299, display: "2.99" },         // $2.99
    },
    quarterly: {
      cny: { amount: 5100, display: "51" },         // ¥51.00
      usd: { amount: 799, display: "7.99" },          // $7.99
    },
    semiannual: {
      cny: { amount: 9000, display: "90" },         // ¥90.00
      usd: { amount: 1399, display: "13.99" },        // $13.99
    },
    annual: {
      cny: { amount: 11900, display: "119" },       // ¥119.00
      usd: { amount: 1699, display: "16.99" },        // $16.99
    },
  } as const,

  /** 根据币种和周期获取定价 */
  get(period: "monthly" | "quarterly" | "semiannual" | "annual", currency: "CNY" | "USD" = "CNY") {
    return this.plans[period][currency.toLowerCase() as "cny" | "usd"]
  },
} as const

export type BillingPeriod = keyof typeof PRICING.plans