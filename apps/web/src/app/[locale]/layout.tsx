import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { ToastProvider } from "@/components/ui/Toast"
import VisitTracker from "@/components/VisitTracker"

const inter = Inter({ subsets: ["latin"] })

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata" })

  return {
    title: t("siteTitle"),
    description: t("siteDescription"),
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = await getMessages({ locale })

  return (
    <html lang={locale}>
      <body className={inter.className}>
        {plausibleDomain && (
          <script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        )}
        <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </NextIntlClientProvider>
        <VisitTracker />
      </body>
    </html>
  )
}
