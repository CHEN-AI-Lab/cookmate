import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

export default function LocaleNotFound() {
  const t = useTranslations("error")
  const tcommon = useTranslations("common")

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl">🔍</span>
        <h1 className="text-2xl font-bold text-[#2D3436] mt-4">{t("notFound")}</h1>
        <p className="text-gray-500 mt-2">{t("notFoundDesc")}</p>
        <Link href="/" className="inline-block mt-6 bg-[#FF6B35] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors">
          {t("backHome")}
        </Link>
      </div>
    </div>
  )
}