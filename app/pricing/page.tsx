import { auth } from "@/lib/auth"
import Link from "next/link"

export default async function PricingPage() {
  const session = await auth()
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <header className="bg-white border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold text-[#2D3436]">CookMate</span>
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center text-[#2D3436]">选择你的计划</h1>
        <p className="text-center text-gray-500 mt-2">免费开始，随时升级</p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              name: "Free",
              price: "¥0",
              period: "",
              features: ["每天 1 次 AI 菜谱", "基础食材管理（5个）", "无需信用卡"],
              cta: "免费开始",
              highlighted: false,
              href: "/register",
            },
            {
              name: "Pro",
              price: "¥15",
              period: "/月",
              features: ["无限 AI 菜谱生成", "智能周计划", "购物清单自动归类", "饮食定制（减脂/增肌等）", "营养追踪"],
              cta: "订阅 Pro",
              highlighted: true,
              href: session ? "/app/settings" : "/register",
            },
            {
              name: "Family",
              price: "¥25",
              period: "/月",
              features: ["Pro 全部功能", "最多 5 个家庭成员", "共享购物清单", "独立口味偏好"],
              cta: "订阅 Family",
              highlighted: false,
              href: session ? "/app/settings" : "/register",
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 ${
                plan.highlighted
                  ? "bg-[#FF6B35] text-white shadow-xl md:scale-105"
                  : "bg-white border border-gray-200 shadow-sm"
              }`}
            >
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className={`mt-2 text-3xl font-bold ${plan.highlighted ? "text-white" : "text-[#2D3436]"}`}>
                {plan.price}<span className="text-lg font-normal">{plan.period}</span>
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span>✅</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 block text-center py-3 rounded-full text-sm font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-white text-[#FF6B35] hover:bg-gray-100"
                    : "bg-gray-100 text-[#2D3436] hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}