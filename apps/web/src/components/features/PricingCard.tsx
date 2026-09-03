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
          <span className="bg-accent text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md tracking-wide">
            {saving}
          </span>
        </div>
      )}

      <div
              className={cn(
                "rounded-2xl px-5 py-6 text-center flex flex-col h-full bg-card border",
                highlighted ? "border-amber-200 ring-1 ring-amber-200" : "border-border"
              )}
            >
              {/* Plan name */}
              <h3
                className={cn(
                  "text-sm font-semibold tracking-wide uppercase",
                  highlighted ? "text-amber-600" : "text-text-secondary"
                )}
              >
                {name}
              </h3>

              {/* Price */}
              <div className="mt-3">
                <span
                  className={cn(
                    "text-4xl font-bold tracking-tight",
                    "text-text-primary"
                  )}
                >
                  <CurrencySymbol locale={locale} />
                  {price}
                </span>
                <span
                  className={cn(
                    "text-base font-normal ml-1",
                    "text-text-secondary"
                  )}
                >
                  {periodLabel}
                </span>
              </div>

              {/* Period description — monthly: "随时取消", annual: "≈ ¥9.92/月 · 省50%" */}
              {period && (
                <p
                  className={cn(
                    "text-xs mt-1.5",
                    "text-text-secondary"
                  )}
                >
                  {period}
                </p>
              )}

              {/* Divider */}
              <div className="w-full h-px my-4 bg-surface" />

              {/* Features */}
              <ul className="space-y-2.5 text-sm text-left flex-1">
                {features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 leading-tight text-text-secondary"
                  >
                    <span className="shrink-0 mt-0.5 text-amber-500">✓</span>
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
                    ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]"
                    : "bg-surface text-text-primary border border-border hover:bg-surface active:scale-[0.98]",
                  (disabled || loading) && "opacity-50 cursor-not-allowed active:scale-100"
                )}
              >
                {loading ? t("processing") : ctaLabel}
              </button>

              {/* Current plan indicator */}
              {isCurrent && (
                <div className="mt-3 text-xs font-medium text-amber-600">
                  {t("currentPlan")}
                </div>
              )}
            </div>
    </div>
  )
}