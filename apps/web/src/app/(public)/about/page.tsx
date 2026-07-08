import { auth } from "@/lib/auth"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"

export default async function AboutPage() {
  const session = await auth()
  const ctaHref = session ? "/app/dashboard" : "/register"
  const t = await getTranslations("about")

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PublicNavbar ctaHref={ctaHref} session={!!session} />

      <section className="max-w-[1400px] mx-auto px-8 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#2D3436]">{t("title")}</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">{t("subtitle")}</p>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-8 space-y-12">
          <div>
            <h2 className="text-2xl font-bold text-[#2D3436] mb-4">{t("storyTitle")}</h2>
            <p className="text-gray-600 leading-relaxed">{t("storyP1")}</p>
            <p className="text-gray-600 leading-relaxed mt-4">{t("storyP2")}</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#2D3436] mb-4">{t("missionTitle")}</h2>
            <p className="text-gray-600 leading-relaxed">{t("missionDesc")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { emoji: "🤖", titleKey: "featureAiTitle", descKey: "featureAiDesc" },
              { emoji: "⚡", titleKey: "featureSpeedTitle", descKey: "featureSpeedDesc" },
              { emoji: "📋", titleKey: "featureFullTitle", descKey: "featureFullDesc" },
            ].map((v) => (
              <div key={v.titleKey} className="text-center p-6 bg-[#FFF8F0] rounded-2xl border border-orange-50">
                <span className="text-4xl">{v.emoji}</span>
                <h3 className="mt-3 font-bold text-[#2D3436]">{t(v.titleKey)}</h3>
                <p className="mt-1 text-sm text-gray-500">{t(v.descKey)}</p>
              </div>
            ))}
          </div>

          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-[#2D3436] mb-4">{t("ctaTitle")}</h2>
            <p className="text-gray-600 mb-6">{t("ctaDesc")}</p>
            <Link
              href={ctaHref}
              className="inline-block bg-[#FF6B35] text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
            >
              {t("ctaButton")}
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}