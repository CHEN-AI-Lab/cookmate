"use client"

import { useTranslations } from "next-intl"

export default function AppError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string }
  reset: () => void
}) {
  void _error
  const t = useTranslations("error")

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8 max-w-md w-full text-center">
        <span className="text-5xl">😵</span>
        <h2 className="text-lg font-bold text-text-primary mt-4">{t("loadFailed")}</h2>
        <p className="text-text-secondary mt-2 text-sm">
          {t("loadFailedDesc")}
        </p>
        <button
          onClick={reset}
          className="mt-4 bg-accent text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          {t("reload")}
        </button>
      </div>
    </div>
  )
}