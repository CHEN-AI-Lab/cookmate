import { auth } from "@/lib/auth"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"

export default async function PrivacyPage() {
  const session = await auth()
  const ctaHref = session ? "/app/dashboard" : "/register"
  const t = await getTranslations("privacy")

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PublicNavbar ctaHref={ctaHref} session={!!session} />

      <section className="max-w-3xl mx-auto px-8 pt-20 pb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#2D3436]">{t("title")}</h1>
        <p className="mt-2 text-sm text-gray-400">{t("lastUpdated")}</p>

        <div className="mt-10 space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("infoCollectTitle")}</h2>
            <p>{t("infoCollectDesc")}</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>{t("infoCollect1")}</li>
              <li>{t("infoCollect2")}</li>
              <li>{t("infoCollect3")}</li>
              <li>{t("infoCollect4")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("usageTitle")}</h2>
            <p>{t("usageDesc")}</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>{t("usage1")}</li>
              <li>{t("usage2")}</li>
              <li>{t("usage3")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("dataShareTitle")}</h2>
            <p>{t("dataShareDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("cookiesTitle")}</h2>
            <p>{t("cookiesDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("rightsTitle")}</h2>
            <p>{t("rightsDesc")}</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>{t("rights1")}</li>
              <li>{t("rights2")}</li>
              <li>{t("rights3")}</li>
              <li>{t("rights4")}</li>
              <li>{t("rights5")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("contactTitle")}</h2>
            <p>
              {t("contactDesc")}{" "}
              <a href="mailto:CookMate@aaigc.online" className="text-[#FF6B35] hover:underline">
                CookMate@aaigc.online
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
          <Link href="/terms" className="hover:text-[#FF6B35] transition-colors">
            {t("viewTerms")}
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}