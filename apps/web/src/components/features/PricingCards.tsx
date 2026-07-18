"use client"
import { useTranslations } from "next-intl"

import { PricingCard } from "./PricingCard"

export function PricingCards() {
  const t = useTranslations("billing")
  const tc = useTranslations("common")

  return (
    <section id="pricing" className="py-16 bg-white">
      <div className="max-w-[1400px] mx-auto px-8">
        <h2 className="text-3xl font-bold text-center text-[#2D3436]">{t("selectPlan")}</h2>
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
            onCta={() => (window.location.href = "/register")}
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
            onCta={() => (window.location.href = "/register")}
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
            onCta={() => (window.location.href = "/register")}
          />
        </div>
      </div>
    </section>
  )
}