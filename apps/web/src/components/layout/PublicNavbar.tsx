"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "@/components/ui/LanguageSwitcher"

export default function PublicNavbar({
  ctaHref,
  session,
}: {
  ctaHref?: string
  session?: boolean
}) {
  const tnav = useTranslations("nav")
  const link = ctaHref || (session ? "/app/dashboard" : "/register")

  return (
    <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🍳</span>
          <span className="text-xl font-bold text-[#2D3436]">CookMate</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/#how" className="hover:text-[#FF6B35]">
            {tnav("howToUse")}
          </Link>
          <Link href="/pricing" className="hover:text-[#FF6B35]">
            {tnav("pricing")}
          </Link>
          <Link href="/about" className="hover:text-[#FF6B35]">
            {tnav("about")}
          </Link>
          <Link
            href="/login"
            className="text-[#FF6B35] font-medium hover:text-orange-600"
          >
            {tnav("login")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}