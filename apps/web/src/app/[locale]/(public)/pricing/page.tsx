import { getTranslations, setRequestLocale } from "next-intl/server"
import { auth } from "@/lib/auth"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"
import { PricingCards } from "@/components/features/PricingCards"

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
  const tb = await getTranslations("billing")

  return (
    <div className="min-h-screen bg-bg-brand">
      <PublicNavbar />

      <section className="max-w-[1400px] mx-auto px-8 pt-20 pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-text-primary">{tb("selectPlan")}</h1>
        <p className="mt-3 text-lg text-text-secondary">{tb("upgradeNow")}</p>
      </section>

      <PricingCards isLoggedIn={!!session?.user} />

      <PublicFooter />
    </div>
  )
}