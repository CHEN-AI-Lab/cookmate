"use client"

import { PricingCard } from "./PricingCard"

export function PricingCards() {
  return (
    <section id="pricing" className="py-16 bg-white">
      <div className="max-w-[1400px] mx-auto px-8">
        <h2 className="text-3xl font-bold text-center text-[#2D3436]">选择你的计划</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <PricingCard
            name="Free"
            price="0"
            period=""
            features={["每天 1 次 AI 推荐", "无限食材位", "AI 菜谱生成"]}
            highlighted={false}
            isCurrent={false}
            ctaLabel="免费开始"
            onCta={() => (window.location.href = "/register")}
            disabled={false}
            loading={false}
          />
          <PricingCard
            name="Pro"
            price="15"
            period="/月"
            features={["无限 AI 生成", "智能周计划", "购物清单", "饮食定制"]}
            highlighted={true}
            isCurrent={false}
            ctaLabel="订阅 Pro"
            onCta={() => (window.location.href = "/register")}
            disabled={false}
            loading={false}
          />
        </div>
      </div>
    </section>
  )
}