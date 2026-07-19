import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

export default function PublicFooter() {
  const tcommon = useTranslations("common")
  const tfooter = useTranslations("footer")

  const links = [
    { href: "/app/recipes", labelKey: "features" },
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
          {/* Brand */}
          <div>
            <span className="text-2xl">🍳</span>
            <p className="text-sm mt-2">{tcommon("appTagline")}</p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-gray-300 font-semibold mb-3 text-xs uppercase tracking-wider">
              {tfooter("links")}
            </p>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#FF6B35] transition-colors">
                    {tfooter(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-gray-300 font-semibold mb-3 text-xs uppercase tracking-wider">
              {tfooter("legal")}
            </p>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-[#FF6B35] transition-colors">
                    {tfooter(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
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

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">{tfooter("copyright", { year: String(new Date().getFullYear()) })}</p>
        </div>
      </div>
    </footer>
  )
}