import { useTranslations } from "next-intl"
import Link from "next/link"

export default function PublicFooter() {
  const tcommon = useTranslations("common")
  const tfooter = useTranslations("footer")

  return (
    <footer className="bg-[#2D3436] text-gray-400 text-sm">
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="text-white font-bold text-lg">🍳 {tcommon("appName")}</p>
            <p className="mt-2 text-gray-500">{tcommon("appTagline")}</p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-gray-300 font-semibold mb-3 text-xs uppercase tracking-wider">
              {tfooter("links")}
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/app/recipes" className="hover:text-[#FF6B35] transition-colors">
                  {tfooter("features")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#FF6B35] transition-colors">
                  {tfooter("pricing")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#FF6B35] transition-colors">
                  {tfooter("about")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#FF6B35] transition-colors">
                  {tfooter("faq")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-gray-300 font-semibold mb-3 text-xs uppercase tracking-wider">
              {tfooter("legal")}
            </p>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-[#FF6B35] transition-colors">
                  {tfooter("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#FF6B35] transition-colors">
                  {tfooter("terms")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-gray-300 font-semibold mb-3 text-xs uppercase tracking-wider">
              {tfooter("contact")}
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href={`mailto:${tfooter("email")}`}
                  className="hover:text-[#FF6B35] transition-colors"
                >
                  {tfooter("email")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-700 text-center text-gray-500">
          <p>{tfooter("copyright")}</p>
        </div>
      </div>
    </footer>
  )
}