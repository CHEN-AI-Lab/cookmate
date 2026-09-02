"use client"
import { useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"
import { PricingCard } from "./PricingCard"

export function PricingCards() {
  const t = useTranslations("billing")
  const router = useRouter()

  return (
    <section id="pricing" className="py-16 bg-card">
      <div className="max-w-[1400px] mx-auto px-8">
        <h2 className="text-3xl font-bold text-center text-text-primary">{t("selectPlan")}</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-stretch">
          {/* Free */}
          <PricingCard
            name="Free"
            price="0"
            periodLabel=""
            period={t("freeTier")}
            features={t.raw("freePlanFeatures") as string[]}
            highlighted={false}
            isCurrent={false}
            ctaLabel={t("selectThisPlan")}
            onCta={() => router.push("/register")}
          />
          {/* Pro Monthly */}
          <PricingCard
            name={t("monthlyPro")}
            price={t("monthlyPrice")}
            periodLabel={t("perMonth")}
            period={t("monthlyPeriod")}
            features={t.raw("proPlanFeatures") as string[]}
            highlighted={false}
            isCurrent={false}
            ctaLabel={t("subscribePro")}
            onCta={() => router.push("/register")}
          />
          {/* Pro Annual — highlighted with savings badge */}
          <PricingCard
            name={t("yearlyPro")}
            price={t("yearlyPrice")}
            periodLabel={t("perYear")}
            period={t("yearlyPeriod")}
            saving={t("yearlySaving")}
            features={t.raw("proPlanFeatures") as string[]}
            highlighted={true}
            isCurrent={false}
            ctaLabel={t("subscribePro")}
            onCta={() => router.push("/register")}
          />
        </div>

        {/* 退款政策声明 — 在「选择计划」白色模块内部，与卡片一体化 */}
        <div className="mt-10 max-w-3xl mx-auto text-center">
          <h3 className="text-sm font-semibold text-text-primary">{t("refundPolicyTitle")}</h3>
          <p className="mt-2 text-xs leading-relaxed text-text-secondary">{t("refundNotice")}</p>
        </div>
      </div>
    </section>
  )
}