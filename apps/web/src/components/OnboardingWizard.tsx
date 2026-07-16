"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { DIET_OPTIONS, CUISINE_OPTIONS, SERVING_SIZE_OPTIONS } from "@cookmate/shared/constants"

const STEPS = ["欢迎", "偏好", "食材", "上手", "完成"]

const QUICK_INGREDIENTS = [
  { cat: "🥬 蔬菜", items: ["西红柿", "青菜", "白菜", "土豆", "胡萝卜", "洋葱", "大蒜", "姜", "葱"] },
  { cat: "🥩 肉禽蛋", items: ["鸡蛋", "鸡胸肉", "鸡腿", "五花肉", "牛肉", "培根"] },
  { cat: "🍚 主食粮油", items: ["大米", "面条", "面粉", "挂面", "食用油"] },
]

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const t = useTranslations("onboarding")
  const ts = useTranslations("settings")
  const router = useRouter()

  const dietLabel: Record<string, string> = {
    "不限": ts("dietUnlimited"), "减脂": ts("dietLoseFat"),
    "增肌": ts("dietBuildMuscle"), "素食": ts("dietVegetarian"),
    "低碳水": ts("dietLowCarb"), "无麸质": ts("dietGlutenFree"),
  }
  const cuisineLabel: Record<string, string> = {
    "中餐": ts("cuisineChinese"), "西餐": ts("cuisineWestern"),
    "日料": ts("cuisineJapanese"), "韩餐": ts("cuisineKorean"),
    "东南亚": ts("cuisineSoutheastAsian"), "印度菜": ts("cuisineIndian"),
    "中东菜": ts("cuisineMiddleEastern"), "墨西哥菜": ts("cuisineMexican"),
  }
  const ingredientCats: Record<string, string> = {
    "🥬 蔬菜": t("catVegetables"),
    "🥩 肉禽蛋": t("catMeat"),
    "🍚 主食粮油": t("catStaples"),
  }
  const [step, setStep] = useState(0)
  const [dietType, setDietType] = useState("不限")
  const [cuisinePref, setCuisinePref] = useState<string[]>([])
  const [servingSize, setServingSize] = useState(2)
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const canNext = () => {
    if (step === 0) return true
    if (step === 1 && cuisinePref.length === 0) {
      return false
    }
    if (step === 2) return true
    return true
  }

  const handleNext = async () => {
    // 检查菜系选择
    if (step === 1 && cuisinePref.length === 0) {
      setError(t("selectCuisineError"))
      return
    }
    if (step < STEPS.length - 1) {
      setError("")
      setStep(step + 1)
      return
    }
    // Complete
    setSaving(true)
    try {
      const res = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dietType, cuisinePref: cuisinePref.join(","), servingSize }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: t("saveFailed") }))
        setError(err.error || t("saveFailed"))
        setSaving(false)
        return
      }
      // Save ingredients
      if (selectedIngredients.size > 0) {
        await fetch("/api/pantry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: Array.from(selectedIngredients).map((n) => ({ name: n })) }),
        })
      }
      onComplete()
    } finally {
      setSaving(false)
    }
  }

  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden relative">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-[#FF6B35] transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Close/skip button */}
        <button
          onClick={async () => {
            const res = await fetch("/api/user/onboarding", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dietType: "不限", cuisinePref: "", servingSize: 2 }),
            })
            if (res.ok) {
              onComplete()
            }
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-sm"
        >
          {t("skip")}
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 pt-5 pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-[#FF6B35]" : "bg-gray-200"
                }`}
              />
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 ${i < step ? "bg-[#FF6B35]" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {step === 0 && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🍳</div>
              <h2 className="text-2xl font-bold text-gray-900">{t("welcomeTitle")}</h2>
              <p className="text-gray-500 mt-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.raw("welcomeDesc") }} />
              <div className="grid grid-cols-3 gap-3 mt-8">
                {[
                  { emoji: "🎯", title: t("step1Card1Title"), desc: t("step1Card1Desc") },
                  { emoji: "🥦", title: t("step1Card2Title"), desc: t("step1Card2Desc") },
                  { emoji: "🤖", title: t("step1Card3Title"), desc: t("step1Card3Desc") },
                ].map((item) => (
                  <div key={item.title} className="text-center p-3 rounded-xl bg-gray-50">
                    <div className="text-2xl">{item.emoji}</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">{item.title}</div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="py-4">
              <h2 className="text-xl font-bold text-gray-900 text-center">{t("preferenceTitle")}</h2>
              <p className="text-gray-500 text-sm text-center mt-1">{t("preferenceDesc")}</p>

              <div className="mt-6">
                <label className="text-sm font-semibold text-gray-700">{t("dietType")}</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DIET_OPTIONS.map((opt) => (
                    <button
                      key={dietLabel[opt]}
                      onClick={() => setDietType(opt)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        dietType === opt
                          ? "bg-[#FF6B35] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {dietLabel[opt]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label className="text-sm font-semibold text-gray-700">{t("cuisinePref")}</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CUISINE_OPTIONS.map((opt) => {
                    const selected = cuisinePref.includes(opt)
                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          setCuisinePref(selected
                            ? cuisinePref.filter((c) => c !== opt)
                            : [...cuisinePref, opt]
                          )
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                          selected
                            ? "bg-[#FF6B35] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {selected ? "✓" : ""} {cuisineLabel[opt]}
                      </button>
                    )
                  })}
                </div>
                {cuisinePref.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">{t("selectedCuisines", { count: cuisinePref.length })}</p>
                )}
                {error && (
                  <p className="text-xs text-red-500 mt-1.5">{error}</p>
                )}
              </div>

              <div className="mt-5">
                <label className="text-sm font-semibold text-gray-700">{t("servingSize")}</label>
                <div className="flex items-center gap-3 mt-2">
                  {SERVING_SIZE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setServingSize(n)}
                      className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                        servingSize === n
                          ? "bg-[#FF6B35] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="py-4">
              <h2 className="text-xl font-bold text-gray-900 text-center">{t("ingredientTitle")}</h2>
              <p className="text-gray-500 text-sm text-center mt-1">{t("ingredientDesc")}</p>

              <div className="mt-5 space-y-3 max-h-64 overflow-y-auto">
                {QUICK_INGREDIENTS.map((group) => (
                  <div key={group.cat}>
                    <p className="text-xs font-semibold text-gray-400 mb-1.5">{ingredientCats[group.cat]}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => toggleIngredient(item)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            selectedIngredients.has(item)
                              ? "bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/30"
                              : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100"
                          }`}
                        >
                          {selectedIngredients.has(item) ? "✓ " : ""}{item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                {t("selectedIngredients", { count: selectedIngredients.size })}
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🤖</div>
              <h2 className="text-xl font-bold text-gray-900">{t("tryAiTitle")}</h2>
              <p className="text-gray-500 mt-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.raw("tryAiDesc") }} />
              <div className="mt-6 inline-flex items-center gap-2 bg-orange-50 text-[#FF6B35] px-4 py-2 rounded-full text-sm font-medium">
                {t("tryAiButton")}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900">{t("readyTitle")}</h2>
              <p className="text-gray-500 mt-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.raw("readyDesc") }} />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => step > 0 && setStep(step - 1)}
              className={`text-sm font-medium transition-colors ${
                step > 0 ? "text-gray-500 hover:text-gray-900" : "text-transparent pointer-events-none"
              }`}
            >
              {t("previous")}
            </button>

            <button
              onClick={handleNext}
              disabled={!canNext() || saving}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                !canNext() || saving
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#FF6B35] text-white hover:bg-orange-600"
              }`}
            >
              {saving ? t("saving") : step === STEPS.length - 1 ? t("startUsing") : t("next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}