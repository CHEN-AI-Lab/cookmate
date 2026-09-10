"use client"

import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"

/**
 * 一键进入体验模式。
 *
 * 注意：体验登录走独立的 HMAC 签名 cookie（POST /api/auth/demo-login），
 * 不经过 NextAuth —— demo provider 早已从 auth.ts 移除，
 * 继续调用 signIn("demo") 会直接失败（点了没反应）。
 */
export default function DemoLoginButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const router = useRouter()
  const t = useTranslations("errors")

  // 失败必须有反馈：此前只在内部把 loading 复位，用户看到的是「点了没反应」
  const showFailed = () => {
    setLoading(false)
    setFailed(true)
    setTimeout(() => setFailed(false), 3000)
  }

  return (
    <>
      {failed && (
        <div className="fixed left-1/2 top-[33vh] -translate-x-1/2 z-[100]">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3.5 rounded-xl shadow-xl text-sm whitespace-nowrap">
            {t("requestFailed")}
          </div>
        </div>
      )}
      <button
        onClick={async () => {
          if (loading) return
          setLoading(true)
          try {
            const res = await fetch("/api/auth/demo-login", { method: "POST" })
            if (!res.ok) {
              showFailed()
              return
            }
            router?.push("/app/dashboard")
          } catch {
            showFailed()
          }
        }}
        className={className + " relative"}
      >
        <span className={loading ? "opacity-0" : ""}>{children}</span>
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
      </button>
    </>
  )
}
