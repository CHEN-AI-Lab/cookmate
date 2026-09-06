"use client"
import { useTranslations, useLocale } from "next-intl"

import { useRouter } from "@/i18n/navigation"
import { PricingCard } from "./PricingCard"
import { PRICING, getPerMonthDisplay, getSaveAmount, getSavePercent } from "@cookmate/shared/constants/pricing"

export function PricingCards({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("billing")
  const router = useRouter()
  const locale = useLocale()
  const currency = locale === "zh-CN" ? "CNY" : "USD" as const
  // 已登录用户点订阅直达账单页；未登录先去注册
  const handleSubscribe = () => router.push(isLoggedIn ? "/app/billing" : "/register")

  const monthlyPrice = PRICING.get("monthly", currency).display
  const annualPrice = PRICING.get("annual", currency).display
  const annualPerMonth = getPerMonthDisplay("annual", currency)
  const annualSavePercent = getSavePercent("annual", currency)
  const annualSaveAmount = getSaveAmount("annual", currency)
  const saveAmountDisplay = currency === "CNY"
    ? `¥${(annualSaveAmount / 100).toFixed(0)}`
    : `$${(annualSaveAmount / 100).toFixed(0)}`

  // 宣传文案用模板 key + 代码传参，价格数字全从 PRICING 算
  const yearlyPeriodText = t("yearlyPeriodTpl", { perMonth: annualPerMonth, percent: annualSavePercent })
  const yearlySavingText = t("yearlySavingTpl", { amount: saveAmountDisplay })

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
            price={monthlyPrice}
            periodLabel={t("perMonth")}
            period={t("monthlyPeriod")}
            features={t.raw("proPlanFeatures") as string[]}
            highlighted={false}
            isCurrent={false}
            ctaLabel={t("subscribePro")}
            onCta={handleSubscribe}
          />
          {/* Pro Annual — highlighted with savings badge */}
          <PricingCard
            name={t("yearlyPro")}
            price={annualPrice}
            periodLabel={t("perYear")}
            period={yearlyPeriodText}
            saving={yearlySavingText}
            features={t.raw("proPlanFeatures") as string[]}
            highlighted={true}
            isCurrent={false}
            ctaLabel={t("subscribePro")}
            onCta={handleSubscribe}
          />
        </div>

        {/* 退款政策声明 — 在「选择计划」白色模块内部，与卡片一体化 */}
        <div className="mt-8 max-w-3xl mx-auto text-center">
          <h3 className="text-[13px] font-semibold text-text-secondary">{t("refundPolicyTitle")}</h3>
          <p className="mt-1.5 text-[11px] leading-relaxed text-text-secondary/80">{t("refundNotice")}</p>
        </div>
      </div>
    </section>
  )
}
