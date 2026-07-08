import { useTranslations } from "next-intl"

export default function PublicFooter() {
  const tcommon = useTranslations("common")
  const tfooter = useTranslations("footer")

  return (
    <footer className="py-10 bg-[#2D3436] text-gray-400 text-sm">
      <div className="max-w-[1400px] mx-auto px-8 text-center">
        <p className="text-white font-bold text-lg">🍳 {tcommon("appName")}</p>
        <p className="mt-2">{tcommon("appTagline")}</p>
        <p className="mt-6">{tfooter("copyright")}</p>
      </div>
    </footer>
  )
}