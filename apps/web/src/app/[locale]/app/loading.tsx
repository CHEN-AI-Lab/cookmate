import { getTranslations } from "next-intl/server"

export default async function Loading() {
  const t = await getTranslations("common")
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#E17055] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">{t("loading")}</p>
      </div>
    </div>
  )
}