import { auth } from "@/lib/auth"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "服务条款 — CookMate",
  description: "CookMate 服务条款 — 使用 CookMate 服务需遵守的条款和条件。",
}

export default async function TermsPage() {
  const session = await auth()
  const ctaHref = session ? "/app/dashboard" : "/register"
  const t = await getTranslations("terms")

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PublicNavbar ctaHref={ctaHref} session={!!session} />

      <section className="max-w-3xl mx-auto px-8 pt-20 pb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#2D3436]">{t("title")}</h1>
        <p className="mt-2 text-sm text-gray-400">{t("lastUpdated")}</p>

        <div className="mt-10 space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("acceptTitle")}</h2>
            <p>{t("acceptDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("accountTitle")}</h2>
            <p>{t("accountDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("subscriptionTitle")}</h2>
            <p>{t("subscriptionDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("aiTitle")}</h2>
            <p>{t("aiDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("disclaimerTitle")}</h2>
            <p>{t("disclaimerDesc")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#2D3436] mb-3">{t("liabilityTitle")}</h2>
            <p>{t("liabilityDesc")}</p>
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
          <Link href="/privacy" className="hover:text-[#FF6B35] transition-colors">
            {t("viewPrivacy")}
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}