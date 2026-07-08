"use client"

import { PricingCard } from "./PricingCard"

const PRO_TIERS = [
  {
    name: "Pro 月付",
    price: "20",
    periodLabel: "/月",
    period: "≈ ¥20/月",
    saving: undefined,
    ctaLabel: "订阅 Pro",
  },
  {
    name: "Pro 季付",
    price: "51",
    periodLabel: "/3月",
    period: "≈ ¥17/月 · 省15%",
    saving: "省 15%",
    ctaLabel: "订阅 Pro",
  },
  {
    name: "Pro 半年",
    price: "90",
    periodLabel: "/6月",
    period: "≈ ¥15/月 · 省25%",
    saving: "省 25%",
    ctaLabel: "订阅 Pro",
  },
  {
    name: "Pro 年付",
    price: "119",
    periodLabel: "/年",
    period: "≈ ¥9.92/月 · 省50%",
    saving: "🔥 省 ¥121",
    ctaLabel: "订阅 Pro",
  },
]

const FREE_FEATURES = ["每天 1 次 AI 推荐", "无限食材位", "AI 菜谱生成"]
const PRO_FEATURES = ["无限 AI 生成", "智能周计划", "购物清单", "饮食定制"]

export function PricingCards() {
  return (
    <section id="pricing" className="py-16 bg-white">
      <div className="max-w-[1400px] mx-auto px-8">
        <h2 className="text-3xl font-bold text-center text-[#2D3436]">选择你的计划</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
          <PricingCard
            name="Free"
            price="0"
            periodLabel=""
            period="免费使用"
            features={FREE_FEATURES}
            highlighted={false}
            isCurrent={false}
            ctaLabel="免费开始"
            onCta={() => (window.location.href = "/register")}
          />
          {PRO_TIERS.map((tier) => (
            <PricingCard
              key={tier.name}
              name={tier.name}
              price={tier.price}
              periodLabel={tier.periodLabel}
              period={tier.period}
              saving={tier.saving}
              features={PRO_FEATURES}
              highlighted={tier.name === "Pro 年付"}
              isCurrent={false}
              ctaLabel={tier.ctaLabel}
              onCta={() => (window.location.href = "/register")}
            />
          ))}
        </div>
      </div>
    </section>
  )
}