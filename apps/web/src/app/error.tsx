"use client"

import { useTranslations } from "next-intl"

export default function RootError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string }
  reset: () => void
}) {
  void _error
  const t = useTranslations("error")

  return (
    <div className="min-h-screen bg-bg-brand flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <span className="text-6xl">😵</span>
        <h2 className="text-xl font-bold text-text-primary mt-4">{t("title")}</h2>
        <p className="text-text-secondary mt-2 text-sm">
          {t("description")}
        </p>
        <button
          onClick={reset}
          className="mt-6 bg-accent text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          {t("reload")}
        </button>
      </div>
    </div>
  )
}