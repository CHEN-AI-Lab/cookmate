import { auth } from "@/lib/auth"
import Link from "next/link"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"
import { PricingCards } from "@/components/features/PricingCards"

export default async function HomePage() {
  const session = await auth()
  const ctaHref = session ? "/app/dashboard" : "/register"

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PublicNavbar ctaHref={ctaHref} session={!!session} />

      {/* Hero */}
      <section className="max-w-[1400px] mx-auto px-8 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#2D3436] leading-tight">
          今天吃什么？
          <br />
          <span className="text-[#FF6B35]">CookMate 帮你决定</span>
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          告诉我你有什么食材，3 秒生成菜谱。
          <br />
          每周智能规划 + 购物清单，从此不再纠结
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={ctaHref}
            className="bg-[#FF6B35] text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
          >
            免费开始使用
          </Link>
          <a
            href="#how"
            className="text-gray-600 px-8 py-3 rounded-full text-lg border border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
          >
            看看怎么用
          </a>
        </div>

        {/* Demo card */}
        <div className="mt-12 max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-left">
            <p className="text-sm text-gray-500 mb-2">试试看 👇</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["鸡肉", "西兰花", "米饭", "大蒜", "酱油"].map((item) => (
                <span
                  key={item}
                  className="bg-orange-50 text-[#FF6B35] px-3 py-1 rounded-full text-sm border border-orange-200"
                >
                  {item}
                </span>
              ))}
            </div>
            <Link
              href={session ? "/app/recipes" : "/register"}
              className="inline-block bg-[#FF6B35] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              🍳 生成菜谱
            </Link>
          </div>
          {/* Result preview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl text-left">
            <p className="text-sm font-medium text-[#2D3436]">推荐菜谱：</p>
            <p className="text-lg font-bold mt-1">🍗 照烧鸡腿饭</p>
            <p className="text-sm text-gray-500 mt-1">⏱ 30分钟 · 🔥 450卡 · 难度：简单</p>
            <p className="text-sm text-gray-600 mt-2">
              鸡肉用酱油和蒜腌制后煎至金黄，搭配焯水的西兰花和米饭...
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#2D3436]">三步搞定</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: "🥦", title: "1. 告诉 AI 你的食材", desc: "从食材库一键导入，或手动输入冰箱里有什么" },
              { emoji: "🤖", title: "2. AI 生成菜谱", desc: "3 秒内获得量身定制的菜谱，含步骤、时间、卡路里" },
              { emoji: "📋", title: "3. 加入周计划 → 生成购物清单", desc: "选好菜谱排入日程，购物清单自动按超市分区归类" },
            ].map((step) => (
              <div key={step.title} className="text-center p-6">
                <span className="text-5xl">{step.emoji}</span>
                <h3 className="mt-4 text-xl font-bold text-[#2D3436]">{step.title}</h3>
                <p className="mt-2 text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-[#FFF8F0]">
        <div className="max-w-[1400px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#2D3436]">更多功能</h2>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: "🍳", title: "AI 菜谱生成", desc: "输入食材，3 秒生成定制菜谱" },
              { emoji: "📅", title: "智能周计划", desc: "AI 一键生成整周菜单，不满意可删除重排" },
              { emoji: "🛒", title: "购物清单", desc: "按超市分区归类，与食材库自动比对" },
              { emoji: "🥗", title: "饮食定制", desc: "减脂、增肌、素食，满足你的饮食需求" },
              { emoji: "🥦", title: "食材库", desc: "管理冰箱食材，AI 优先用存货推荐菜谱" },
              { emoji: "📚", title: "我的菜谱", desc: "收藏和管理你的私房菜谱" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-orange-50">
                <span className="text-3xl">{f.emoji}</span>
                <h3 className="mt-3 font-bold text-[#2D3436]">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

<PricingCards />

      <PublicFooter />
    </div>
  )
}