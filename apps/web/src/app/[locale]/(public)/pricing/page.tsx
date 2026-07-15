import { auth } from "@/lib/auth"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"
import { PricingCards } from "@/components/features/PricingCards"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "定价 — CookMate",
  description: "免费开始使用 CookMate Pro，无限 AI 菜谱生成、智能周计划、购物清单。",
}

export default async function PricingPage() {
  const session = await auth()
  const ctaHref = session ? "/app/dashboard" : "/register"
  const tb = await getTranslations("billing")

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PublicNavbar ctaHref={ctaHref} session={!!session} />

      <section className="max-w-[1400px] mx-auto px-8 pt-20 pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#2D3436]">{tb("selectPlan")}</h1>
        <p className="mt-3 text-lg text-gray-500">{tb("upgradeNow")}</p>
      </section>

      <PricingCards />

      <PublicFooter />
    </div>
  )
}