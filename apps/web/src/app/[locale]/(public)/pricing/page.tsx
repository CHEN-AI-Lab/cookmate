import { auth } from "@/lib/auth"
import { getTranslations, setRequestLocale } from "next-intl/server"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"
import { PricingCards } from "@/components/features/PricingCards"
import { routing } from "@/i18n/routing"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const tb = await getTranslations({ locale, namespace: "billing" })

  return {
    title: `${tb("selectPlan")} — CookMate`,
    description: tb("upgradeNow"),
  }
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

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