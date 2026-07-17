"use client"

import { useState, useEffect } from "react"
import { useLocale } from "next-intl"
import Link from "next/link"

const STORAGE_KEY = "cookmate_demo_onboarding_done"

const steps = {
  "zh-CN": [
    { title: "👋 欢迎体验 CookMate", desc: "这是演示版本。设置口味偏好、添加食材、AI 推荐菜谱 — 三步搞定一周饭菜。所有功能都能直接使用。" },
    { title: "🍳 AI 智能菜谱", desc: "输入你冰箱里的食材，AI 秒出菜谱推荐。不满意随时重新生成，还能一键收藏、加入周计划。" },
    { title: "📅 周计划 & 购物清单", desc: "在周计划中规划一周三餐，系统自动汇总购物清单。勾选已买的食材，自动同步到食材库。" },
    { title: "🥦 食材管理", desc: "在食材库中管理你的食材，系统会提醒你哪些已有、哪些需要购买。分类一目了然。" },
    { title: "💡 温馨提示", desc: "体验用户的数据无法保存。如需保存您的设置和菜谱，请", action: "注册账号。" },
  ],
  en: [
    { title: "👋 Welcome to CookMate", desc: "This is the demo version. Set preferences, add pantry items, get AI recipes — three steps to your weekly meals. Everything is ready to try." },
    { title: "🍳 AI Smart Recipes", desc: "Enter what you have in your fridge, get instant recipe suggestions. Not happy? Regenerate with one click. Save favorites and add to your meal plan." },
    { title: "📅 Meal Plan & Grocery List", desc: "Plan your weekly meals and let the system auto-generate your shopping list. Check off items and they sync to your pantry automatically." },
    { title: "🥦 Pantry Management", desc: "Manage your ingredients in the pantry. The system tracks what you have and what to buy, organized by category." },
    { title: "💡 Note", desc: "Demo user data cannot be saved. ", action: "Sign up for free to save your settings and recipes." },
  ],
}

export default function DemoOnboarding() {
  const locale = useLocale()
  const isEn = locale === "en" || locale.startsWith("en")
  const content = isEn ? steps.en : steps["zh-CN"]
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      localStorage.setItem(STORAGE_KEY, "1")
      Promise.resolve().then(() => setVisible(true))
    }
  }, [])

  const next = () => {
    if (step < content.length - 1) {
      setStep(step + 1)
    }
  }

  const prev = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const close = () => setVisible(false)

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <div className="text-4xl mb-3">{content[step].title.split(" ")[0]}</div>
        <h3 className="font-bold text-lg text-[#2D3436] mb-2">{content[step].title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          {content[step].desc}
          {step === content.length - 1 && content[step].action && (
            <Link href="/register" className="text-[#FF6B35] hover:underline font-medium" onClick={close}>
              {content[step].action}
            </Link>
          )}
        </p>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mt-5">
          {content.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? "bg-[#FF6B35]" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
                <div className="flex gap-2 mt-5">
                  {step > 0 && step < content.length - 1 && (
                    <button onClick={prev} className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      {isEn ? "← Back" : "← 上一步"}
                    </button>
                  )}
                  {step === 0 && (
                    <button onClick={close} className="flex-1 px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      {isEn ? "Skip" : "跳过"}
                    </button>
                  )}
                  {step < content.length - 1 ? (
                    <button onClick={next} className="flex-1 px-4 py-2.5 text-sm text-white bg-[#FF6B35] rounded-xl hover:bg-orange-600 font-medium transition-colors">
                      {isEn ? "Next →" : "下一步 →"}
                    </button>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <button onClick={close} className="flex-1 px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        {isEn ? "Later" : "稍后"}
                      </button>
                      <Link href="/register" onClick={close} className="flex-1 px-4 py-2.5 text-sm text-center text-white bg-[#FF6B35] rounded-xl hover:bg-orange-600 font-medium transition-colors">
                        {isEn ? "Free Sign Up" : "免费注册"}
                      </Link>
                    </div>
                  )}
        </div>
      </div>
    </div>
  )
}