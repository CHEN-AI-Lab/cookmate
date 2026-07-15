"use client"

import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { locales } from "@cookmate/shared/messages"
import type { MessageLocale } from "@cookmate/shared/messages"

export default function PublicFooter() {
  const locale = useLocale()
  const tcommon = useTranslations("common")
  const tfooter = useTranslations("footer")

  const navigate = (href: string) => {
    window.location.href = `/${locale}${href}`
  }

  const links = [
    { href: "/app/recipes", labelKey: "aiRecipes" },
    { href: "/pricing", labelKey: "pricing" },
    { href: "/about", labelKey: "about" },
    { href: "/faq", labelKey: "faq" },
  ] as const

  const legalLinks = [
    { href: "/privacy", labelKey: "privacy" },
    { href: "/terms", labelKey: "terms" },
  ] as const

  return (
    <footer className="bg-[#2D3436] text-gray-400">
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span className="text-2xl">🍳</span>
            <p className="text-sm mt-2">{tcommon("slogan")}</p>
          </div>

          <div>
            <p className="text-gray-300 font-semibold mb-3 text-xs uppercase tracking-wider">
              {tfooter("links")}
            </p>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="hover:text-[#FF6B35] transition-colors"
                  >
                    {tfooter(link.labelKey)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-gray-300 font-semibold mb-3 text-xs uppercase tracking-wider">
              {tfooter("legal")}
            </p>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="hover:text-[#FF6B35] transition-colors"
                  >
                    {tfooter(link.labelKey)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-gray-300 font-semibold mb-3 text-xs uppercase tracking-wider">
              {tfooter("contact")}
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={`mailto:${tfooter("email")}`} className="hover:text-[#FF6B35] transition-colors">
                  {tfooter("email")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">{tfooter("copyright")}</p>
          <div className="flex gap-2">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => { window.location.href = `/${l}` }}
                className="text-xs px-2 py-1 rounded hover:text-[#FF6B35] transition-colors"
              >
                {l === "zh-CN" ? "中文" : "English"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}