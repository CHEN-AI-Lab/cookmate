import { auth } from "@/lib/auth"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"
import { PricingCards } from "@/components/features/PricingCards"

export default async function PricingPage() {
  const session = await auth()
  const ctaHref = session ? "/app/dashboard" : "/register"

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PublicNavbar ctaHref={ctaHref} session={!!session} />

      <section className="max-w-[1400px] mx-auto px-8 pt-20 pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#2D3436]">选择你的计划</h1>
        <p className="mt-3 text-lg text-gray-500">免费开始，随时升级</p>
      </section>

      <PricingCards />

      <PublicFooter />
    </div>
  )
}