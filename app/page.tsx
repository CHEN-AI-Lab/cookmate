import { auth } from "@/lib/auth"
import Link from "next/link"

export default async function HomePage() {
  const session = await auth()
  const ctaHref = session ? "/app/dashboard" : "/register"

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold text-[#2D3436]">CookMate</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#how" className="hover:text-[#FF6B35]">使用流程</a>
            <a href="#pricing" className="hover:text-[#FF6B35]">定价</a>
            <Link href="/login" className="text-[#FF6B35] font-medium hover:text-orange-600">登录</Link>
          </nav>
          <Link
            href={ctaHref}
            className="bg-[#FF6B35] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            免费开始
          </Link>
        </div>
      </header>

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
              href={ctaHref}
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
              { emoji: "🥦", title: "1. 告诉 AI 你的食材", desc: "输入冰箱里有什么，或者想吃什么口味" },
              { emoji: "🤖", title: "2. AI 生成菜谱", desc: "3 秒内获得量身定制的菜谱，含步骤和时间" },
              { emoji: "📋", title: "3. 自动生成购物清单", desc: "选好一周菜单，购物清单自动归类" },
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
              { emoji: "📅", title: "智能周计划", desc: "AI 根据你的口味自动生成整周菜单" },
              { emoji: "🛒", title: "购物清单", desc: "按超市分区归类，买菜效率翻倍" },
              { emoji: "🥗", title: "饮食定制", desc: "减脂、增肌、素食，满足你的饮食需求" },
              { emoji: "♻️", title: "剩菜改造", desc: "昨晚剩了什么？AI 帮你变成新菜" },
              { emoji: "📊", title: "营养追踪", desc: "每日热量、蛋白质、碳水一目了然" },
              { emoji: "📷", title: "拍照识别", desc: "拍张冰箱照片，AI 自动识别食材" },
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

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-8">
          <h2 className="text-3xl font-bold text-center text-[#2D3436]">选择你的计划</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Free",
                price: "免费",
                period: "",
                features: ["每天 1 次 AI 推荐", "基础菜谱搜索", "无限食材位"],
                cta: "免费开始",
                highlighted: false,
              },
              {
                name: "Pro",
                price: "15",
                period: "/月",
                features: [
                  "无限 AI 生成",
                  "智能周计划",
                  "购物清单",
                  "饮食定制",
                  "营养追踪",
                ],
                cta: "订阅 Pro",
                highlighted: true,
              },
              {
                name: "Family",
                price: "25",
                period: "/月",
                features: [
                  "Pro 全部功能",
                  "最多 5 个家庭成员",
                  "共享购物清单",
                  "独立口味偏好",
                ],
                cta: "订阅 Family",
                highlighted: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 ${
                  plan.highlighted
                    ? "bg-[#FF6B35] text-white shadow-xl scale-105"
                    : "bg-white border border-gray-200 shadow-sm"
                }`}
              >
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className={`mt-2 text-3xl font-bold ${plan.highlighted ? "text-white" : "text-[#2D3436]"}`}>
                  ¥{plan.price}<span className="text-lg font-normal">{plan.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span>✅</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === "Free" ? "/register" : ctaHref}
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
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-[#2D3436] text-gray-400 text-sm">
        <div className="max-w-[1400px] mx-auto px-8 text-center">
          <p className="text-white font-bold text-lg">🍳 CookMate</p>
          <p className="mt-2">AI 智能食谱 & 餐食规划平台</p>
          <p className="mt-6">© 2026 CookMate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}