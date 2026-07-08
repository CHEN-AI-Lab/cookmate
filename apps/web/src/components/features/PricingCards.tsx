"use client"
import { useTranslations } from "next-intl"

import { PricingCard } from "./PricingCard"

export function PricingCards() {
  const t = useTranslations("billing")
  const tc = useTranslations("common")

  const PRO_TIERS = [
    {
      nameKey: "proMonthly",
      price: "20",
      periodLabelKey: "perMonth",
      period: t("monthlyPeriod"),
      saving: undefined,
      ctaLabelKey: "subscribePro",
    },
    {
      nameKey: "proQuarterly",
      price: "51",
      periodLabelKey: "per3Months",
      period: `≈ ¥17/${t("perMonth")} · ${t("savePercent", { percent: "15" })}`,
      saving: t("savePercent", { percent: "15" }),
      ctaLabelKey: "subscribePro",
    },
    {
      nameKey: "proHalfYear",
      price: "90",
      periodLabelKey: "per6Months",
      period: `≈ ¥15/${t("perMonth")} · ${t("savePercent", { percent: "25" })}`,
      saving: t("savePercent", { percent: "25" }),
      ctaLabelKey: "subscribePro",
    },
    {
      nameKey: "proYearly",
      price: "119",
      periodLabelKey: "perYear",
      period: `≈ ¥9.92/${t("perMonth")} · ${t("savePercent", { percent: "50" })}`,
      saving: `🔥 ${t("saveAmount", { amount: "¥121" })}`,
      ctaLabelKey: "subscribePro",
    },
  ]

  return (
    <section id="pricing" className="py-16 bg-white">
      <div className="max-w-[1400px] mx-auto px-8">
        <h2 className="text-3xl font-bold text-center text-[#2D3436]">{t("selectPlan")}</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
          <PricingCard
            name="Free"
            price="0"
            periodLabel=""
            period={t("freeTier")}
            features={t.raw("freePlanFeatures") as string[]}
            highlighted={false}
            isCurrent={false}
            ctaLabel={tc("freeStart")}
            onCta={() => (window.location.href = "/register")}
          />
          {PRO_TIERS.map((tier) => (
            <PricingCard
              key={tier.nameKey}
              name="Pro"
              price={tier.price}
              periodLabel=""
              period={tier.period}
              saving={tier.saving}
              features={t.raw("proPlanFeatures") as string[]}
              highlighted={true}
              isCurrent={false}
              ctaLabel={t("subscribePro")}
              onCta={() => (window.location.href = "/register")}
            />
          ))}
        </div>
      </div>
    </section>
  )
}