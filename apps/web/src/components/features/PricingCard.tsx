"use client"

import { useLocale } from "next-intl"
import { useTranslations } from "next-intl"
import { cn } from "@cookmate/shared/utils"

interface PricingCardProps {
  name: string
  price: string
  period: string
  periodLabel: string
  saving?: string
  features: string[]
  highlighted: boolean
  isCurrent: boolean
  ctaLabel: string
  onCta: () => void
  disabled?: boolean
  loading?: boolean
}

function CurrencySymbol({ locale }: { locale: string }) {
  return <>{locale === "zh-CN" ? "¥" : "$"}</>
}

export function PricingCard({
  name,
  price,
  period,
  periodLabel,
  saving,
  features,
  highlighted,
  isCurrent,
  ctaLabel,
  onCta,
  disabled,
  loading,
}: PricingCardProps) {
  const locale = useLocale()
  const t = useTranslations("billing")

  return (
    <div className="relative">
      {/* Recommended badge */}
      {saving && highlighted && (
        <div className="absolute -top-3 inset-x-0 flex justify-center z-10">
          <span className="bg-[#FF6B35] text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md tracking-wide">
            {saving}
          </span>
        </div>
      )}

      <div
        className={cn(
          "rounded-2xl px-5 py-6 text-center flex flex-col h-full",
          highlighted
            ? "bg-[#FF6B35] text-white shadow-xl ring-2 ring-[#FF6B35]"
            : "bg-white border border-gray-200"
        )}
      >
        {/* Plan name */}
        <h3
          className={cn(
            "text-sm font-semibold tracking-wide uppercase",
            highlighted ? "text-white/80" : "text-gray-500"
          )}
        >
          {name}
        </h3>

        {/* Price */}
        <div className="mt-3">
          <span
            className={cn(
              "text-4xl font-bold tracking-tight",
              highlighted ? "text-white" : "text-gray-900"
            )}
          >
            <CurrencySymbol locale={locale} />
            {price}
          </span>
          <span
            className={cn(
              "text-base font-normal ml-1",
              highlighted ? "text-white/70" : "text-gray-400"
            )}
          >
            {periodLabel}
          </span>
        </div>

        {/* Period description */}
        <p
          className={cn(
            "text-xs mt-1.5",
            highlighted ? "text-white/60" : "text-gray-400"
          )}
        >
          {period}
        </p>

        {/* Divider */}
        <div
          className={cn(
            "w-full h-px my-4",
            highlighted ? "bg-white/20" : "bg-gray-100"
          )}
        />

        {/* Features */}
        <ul className="space-y-2.5 text-sm text-left flex-1">
          {features.map((f) => (
            <li
              key={f}
              className={cn(
                "flex items-start gap-2.5 leading-tight",
                highlighted ? "text-white/85" : "text-gray-600"
              )}
            >
              <span className="shrink-0 mt-0.5">
                {highlighted ? "✓" : "✓"}
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={onCta}
          disabled={disabled || loading}
          className={cn(
            "mt-6 w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
            highlighted
              ? "bg-white text-[#FF6B35] hover:bg-gray-100 active:scale-[0.98]"
              : "bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100 active:scale-[0.98]",
            (disabled || loading) && "opacity-50 cursor-not-allowed active:scale-100"
          )}
        >
          {loading ? t("processing") : ctaLabel}
        </button>

        {/* Current plan indicator */}
        {isCurrent && (
          <div
            className={cn(
              "mt-3 text-xs font-medium",
              highlighted ? "text-white/70" : "text-gray-400"
            )}
          >
            {t("currentPlan")}
          </div>
        )}
      </div>
    </div>
  )
}