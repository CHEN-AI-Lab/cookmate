"use client"

import { cn } from "@cookmate/shared/utils"

interface PricingCardProps {
  name: string
  price: string
  period: string
  features: string[]
  highlighted: boolean
  isCurrent: boolean
  ctaLabel: string
  onCta: () => void
  disabled?: boolean
  loading?: boolean
}

export function PricingCard({
  name,
  price,
  period,
  features,
  highlighted,
  isCurrent,
  ctaLabel,
  onCta,
  disabled,
  loading,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-5 text-center",
        highlighted
          ? "bg-[#FF6B35] text-white scale-105 shadow-xl"
          : "bg-white border border-gray-200"
      )}
    >
      <h3
        className={cn(
          "text-lg font-bold",
          highlighted ? "text-white" : "text-gray-900"
        )}
      >
        {name}
      </h3>
      <p
        className={cn(
          "text-3xl font-bold mt-2",
          highlighted ? "text-white" : "text-gray-900"
        )}
      >
        ¥{price}
        <span
          className={cn(
            "text-lg font-normal",
            highlighted ? "opacity-80" : "text-gray-400"
          )}
        >
          {period}
        </span>
      </p>
      <ul className="mt-4 space-y-2 text-sm text-left">
        {features.map((f) => (
          <li
            key={f}
            className={cn(
              "flex items-center gap-2",
              highlighted ? "opacity-90" : "text-gray-600"
            )}
          >
            <span>✅</span> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onCta}
        disabled={disabled || loading}
        className={cn(
          "mt-6 w-full py-2.5 rounded-full text-sm font-semibold transition-colors",
          highlighted
            ? "bg-white text-[#FF6B35] hover:bg-gray-100"
            : "bg-gray-100 text-gray-900 hover:bg-gray-200",
          (disabled || loading) && "opacity-50 cursor-not-allowed"
        )}
      >
        {loading ? "处理中..." : ctaLabel}
      </button>
      {isCurrent && (
        <div className="mt-3 text-sm text-gray-400">当前计划</div>
      )}
    </div>
  )
}