"use client"
import { useTranslations, useLocale } from "next-intl"
import { INGREDIENT_LABELS } from "@cookmate/shared/constants/ingredients"

interface GroceryItem {
  name: string
  quantity: string
  inPantry: boolean
  sources: Array<{ title: string; quantity: string }>
}

interface GroceryCategory {
  name: string
  items: GroceryItem[]
}

interface GroceryCategoryListProps {
  categories: GroceryCategory[]
  checked: Set<string>
  onToggleCheck: (name: string) => void
  onSourceClick: (
    name: string,
    sources: Array<{ title: string; quantity: string }>
  ) => void
  inPantryCount: number
  total: number
}

function getCategoryHeaderColor(name: string): string {
  const lower = name.toLowerCase()
  if (
    lower.includes("蔬菜") ||
    lower.includes("veg") ||
    lower.includes("veggie")
  )
    return "bg-green-50 text-green-600"
  if (
    lower.includes("水果") ||
    lower.includes("fruit") ||
    lower.includes("乳品") ||
    lower.includes("dairy")
  )
    return "bg-yellow-50 text-yellow-700"
  if (
    lower.includes("肉") ||
    lower.includes("蛋") ||
    lower.includes("meat") ||
    lower.includes("egg")
  )
    return "bg-red-50 text-red-600"
  if (
    lower.includes("主食") ||
    lower.includes("粮油") ||
    lower.includes("grain") ||
    lower.includes("oil")
  )
    return "bg-amber-50 text-amber-700"
  if (
    lower.includes("调味") ||
    lower.includes("seasoning") ||
    lower.includes("spice")
  )
    return "bg-purple-50 text-purple-700"
  return "bg-surface text-text-primary"
}

export function GroceryCategoryList({
  categories,
  checked,
  onToggleCheck,
  onSourceClick,
  inPantryCount,
  total,
}: GroceryCategoryListProps) {
  const t = useTranslations("grocery")
  const locale = useLocale()
  const catLabels = t.raw("catLabels") as Record<string, string>
  const displayName = (name: string) => locale === "zh-CN" || locale === "zh-TW" ? name : (INGREDIENT_LABELS[name] || name)
  return (
    <div>
      {/* Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-secondary">{t("totalItems", { count: total })}</span>
          {inPantryCount > 0 && (
            <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs">
              {t("inPantryCount", { count: inPantryCount })}
            </span>
          )}
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">📋</span>
          <p className="mt-4 text-text-secondary">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-0">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="border-b border-border py-2 last:border-b-0"
            >
              <h3
                className={`text-xs font-semibold uppercase tracking-wider mb-1 px-1.5 py-0.5 rounded-md inline-block ${getCategoryHeaderColor(cat.name)}`}
              >
                {catLabels[cat.name] || cat.name}
              </h3>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                {cat.items.map((item, i) => (
                  <label
                    key={i}
                    className="text-sm flex items-center gap-1.5 cursor-pointer hover:text-accent transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(item.name)}
                      onChange={() => onToggleCheck(item.name)}
                      className="rounded accent-accent w-3.5 h-3.5 shrink-0"
                    />
                    <span
                      className={`${
                        item.inPantry
                          ? "text-green-600"
                          : checked.has(item.name)
                            ? "text-text-secondary line-through"
                            : "text-text-secondary"
                      } cursor-pointer ${
                        item.sources && item.sources.length > 0
                          ? "border-b border-dashed border-gray-300 hover:border-accent"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        if (item.sources && item.sources.length > 0) {
                          onSourceClick(item.name, item.sources)
                        }
                      }}
                    >
                      {displayName(item.name)}
                      {item.quantity && (
                        <span className="text-text-secondary font-normal">
                          {" "}
                          ({item.quantity})
                        </span>
                      )}
                    </span>
                    {item.inPantry && (
                      <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded shrink-0">
                        {t("inPantry")}
                      </span>
                    )}
                    {item.sources && item.sources.length > 0 && (
                      <span className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        🔍
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary footer */}
      <div className="mt-4 text-xs text-text-secondary text-center border-t border-border pt-3">
        {total > 0
          ? `${total} items · ${inPantryCount} already in pantry`
          : "No items"}
      </div>
    </div>
  )
}