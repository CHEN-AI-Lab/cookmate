"use client"

import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import LanguageSwitcher from "@/components/ui/LanguageSwitcher"

export default function PublicNavbar({
  ctaHref,
  session,
}: {
  ctaHref?: string
  session?: boolean
}) {
  const locale = useLocale()
  const tnav = useTranslations("nav")
  const link = ctaHref || (session ? "/app/dashboard" : "/register")

  const navigate = (href: string) => {
    window.location.href = `/${locale}${href}`
  }

  return (
    <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 shrink-0"
        >
          <span className="text-2xl">🍳</span>
          <span className="text-xl font-bold text-[#2D3436]">CookMate</span>
        </button>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
          <button
            onClick={() => navigate("/#how")}
            className="hover:text-[#FF6B35]"
          >
            {tnav("howToUse")}
          </button>
          <button
            onClick={() => navigate("/pricing")}
            className="hover:text-[#FF6B35]"
          >
            {tnav("pricing")}
          </button>
          <button
            onClick={() => navigate("/about")}
            className="hover:text-[#FF6B35]"
          >
            {tnav("about")}
          </button>
          <button
            onClick={() => navigate("/faq")}
            className="hover:text-[#FF6B35]"
          >
            {tnav("faq")}
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => navigate("/login")}
            className="text-[#FF6B35] font-medium hover:text-orange-600 text-sm"
          >
            {tnav("login")}
          </button>
        </div>
      </div>
    </header>
  )
}