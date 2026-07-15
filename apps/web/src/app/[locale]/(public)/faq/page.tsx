import { auth } from "@/lib/auth"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "常见问题 — CookMate",
  description: "CookMate 常见问题解答 — 关于注册、订阅、支付、数据安全等问题的解答。",
}

export default async function FAQPage() {
  const session = await auth()
  const ctaHref = session ? "/app/dashboard" : "/register"
  const t = await getTranslations("faq")

  const items = [
    { q: "q1", a: "a1" },
    { q: "q2", a: "a2" },
    { q: "q3", a: "a3" },
    { q: "q4", a: "a4" },
    { q: "q5", a: "a5" },
    { q: "q6", a: "a6" },
    { q: "q7", a: "a7" },
    { q: "q8", a: "a8" },
  ]

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PublicNavbar ctaHref={ctaHref} session={!!session} />

      <section className="max-w-3xl mx-auto px-8 pt-20 pb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#2D3436]">{t("title")}</h1>
        <p className="mt-3 text-lg text-gray-500">{t("subtitle")}</p>

        <div className="mt-10 space-y-4">
          {items.map((item) => (
            <details
              key={item.q}
              className="bg-white rounded-2xl border border-orange-50 shadow-sm overflow-hidden group"
            >
              <summary className="px-6 py-4 cursor-pointer font-medium text-[#2D3436] hover:text-[#FF6B35] transition-colors list-none flex items-center justify-between">
                <span>{t(item.q)}</span>
                <span className="text-gray-300 group-open:rotate-180 transition-transform text-lg">▼</span>
              </summary>
              <div className="px-6 pb-4 text-gray-600 leading-relaxed text-sm border-t border-orange-50 pt-3">
                {t(item.a)}
              </div>
            </details>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}