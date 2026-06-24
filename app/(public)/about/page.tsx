import { auth } from "@/lib/auth"
import Link from "next/link"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"

export default async function AboutPage() {
  const session = await auth()
  const ctaHref = session ? "/app/dashboard" : "/register"

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PublicNavbar ctaHref={ctaHref} session={!!session} />

      <section className="max-w-[1400px] mx-auto px-8 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#2D3436]">
          关于 CookMate
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          让 AI 帮你终结「今天吃什么」的每日难题
        </p>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-8 space-y-12">
          <div>
            <h2 className="text-2xl font-bold text-[#2D3436] mb-4">📖 我们的故事</h2>
            <p className="text-gray-600 leading-relaxed">
              CookMate 诞生于一个最简单也最烦人的问题——每天都要想「吃什么」。
              不管是忙碌的工作日还是悠闲的周末，这个看似简单的问题总能消耗我们大量的精力。
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              我们想：为什么不让人工智能来帮你做这个决定？告诉 CookMate 你冰箱里有什么食材，
              或者你想吃什么口味，3 秒内就能得到量身定制的菜谱。从周计划到购物清单，
              一站式解决「吃什么→买什么→怎么做」的完整闭环。
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#2D3436] mb-4">🎯 我们的使命</h2>
            <p className="text-gray-600 leading-relaxed">
              让每个人都能轻松吃好每一餐。不需要精湛的厨艺，不需要复杂的规划，
              只需要打开 CookMate，3 秒搞定。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { emoji: "🤖", title: "AI 驱动", desc: "先进的 AI 技术，根据你的食材和口味偏好，智能推荐最适合你的菜谱" },
              { emoji: "⚡", title: "3 秒出菜谱", desc: "输入食材，眨眼间就能看到可做的菜谱，含详细的步骤和烹饪时间" },
              { emoji: "📋", title: "全流程管理", desc: "从周计划到购物清单，买菜做饭一站式搞定，不再遗漏任何食材" },
            ].map((v) => (
              <div key={v.title} className="text-center p-6 bg-[#FFF8F0] rounded-2xl border border-orange-50">
                <span className="text-4xl">{v.emoji}</span>
                <h3 className="mt-3 font-bold text-[#2D3436]">{v.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-[#2D3436] mb-4">🚀 开始使用</h2>
            <p className="text-gray-600 mb-6">免费注册，立即体验 AI 智能食谱推荐</p>
            <Link
              href={ctaHref}
              className="inline-block bg-[#FF6B35] text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
            >
              免费开始使用
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}