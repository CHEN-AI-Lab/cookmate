"use client"

import { useState, useEffect } from "react"
import { useLocale } from "next-intl"
import Link from "next/link"

const STORAGE_KEY = "cookmate_demo_onboarding_done"

const steps = {
  "zh-CN": [
    { title: "👋 欢迎体验 CookMate", desc: "这是演示版本，您可以直接体验 CookMate 的所有功能。" },
    { title: "🍳 智能菜谱", desc: "点击「AI 菜谱」可以自动生成个性化菜谱，也可以查看示例菜谱。" },
    { title: "📅 周计划", desc: "在「周计划」中规划一周的饮食，系统会自动生成购物清单。" },
    { title: "🥦 食材管理", desc: "在「食材库」中管理您的食材，系统会提醒您哪些已有、哪些需要购买。" },
    { title: "💡 温馨提示", desc: "体验用户的数据无法保存。如需保存您的设置和菜谱，请", action: "注册账号。" },
  ],
  en: [
    { title: "👋 Welcome to CookMate", desc: "This is a demo version. You can explore all CookMate features right away." },
    { title: "🍳 AI Recipes", desc: "Click 'AI Recipes' to generate personalized recipes, or browse sample recipes." },
    { title: "📅 Meal Planner", desc: "Plan your weekly meals and let the system auto-generate your grocery list." },
    { title: "🥦 Pantry Management", desc: "Manage your pantry ingredients — the system tracks what you have and what to buy." },
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
        <p className="text-sm text-gray-500 leading-relaxed">{content[step].desc}</p>

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
          {step > 0 ? (
            <button
              onClick={prev}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {isEn ? "← Back" : "← 上一步"}
            </button>
          ) : (
            <button
              onClick={close}
              className="flex-1 px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {isEn ? "Skip" : "跳过"}
            </button>
          )}
          {step < content.length - 1 ? (
            <button
              onClick={next}
              className="flex-1 px-4 py-2.5 text-sm text-white bg-[#FF6B35] rounded-xl hover:bg-orange-600 font-medium transition-colors"
            >
              {isEn ? "Next →" : "下一步 →"}
            </button>
          ) : (
            <button
              onClick={close}
              className="flex-1 px-4 py-2.5 text-sm text-white bg-[#FF6B35] rounded-xl hover:bg-orange-600 font-medium transition-colors"
            >
              {isEn ? "Got it!" : "知道了！"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}