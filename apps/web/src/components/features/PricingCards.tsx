"use client"

import { PricingCard } from "./PricingCard"

const PRO_TIERS = [
  {
    nameKey: "proMonthly",
    price: "20",
    periodLabelKey: "perMonth",
    period: "≈ ¥20/月",
    saving: undefined,
    ctaLabelKey: "subscribePro",
  },
  {
    nameKey: "proQuarterly",
    price: "51",
    periodLabelKey: "per3Months",
    period: "≈ ¥17/月 · 省15%",
    saving: "省 15%",
    ctaLabelKey: "subscribePro",
  },
  {
    nameKey: "proHalfYear",
    price: "90",
    periodLabelKey: "per6Months",
    period: "≈ ¥15/月 · 省25%",
    saving: "省 25%",
    ctaLabelKey: "subscribePro",
  },
  {
    nameKey: "proYearly",
    price: "119",
    periodLabelKey: "perYear",
    period: "≈ ¥9.92/月 · 省50%",
    saving: "🔥 省 ¥121",
    ctaLabelKey: "subscribePro",
  },
]

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
            features={["每天 1 次 AI 推荐", "无限食材位", "AI 菜谱生成"]}
            highlighted={false}
            isCurrent={false}
            ctaLabel="免费开始"
            onCta={() => (window.location.href = "/register")}
          />
          {PRO_TIERS.map((tier) => (
            <PricingCard
              key={tier.nameKey}
              name="Pro"
              price={tier.price}
              periodLabel=""
              period={tier.period}
              saving={tier.saving}
              features={["无限 AI 生成", "智能周计划", "购物清单", "饮食定制"]}
              highlighted={true}
              isCurrent={false}
              ctaLabel="订阅 Pro"
              onCta={() => (window.location.href = "/register")}
            />
          ))}
        </div>
      </div>
    </section>
  )
}