import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { ToastProvider } from "@/components/ui/Toast"
import VisitTracker from "@/components/VisitTracker"

const inter = Inter({ subsets: ["latin"] })

// 关键：内联首屏暗色样式。配合下方 <style href+precedence> 用，
// React 19 会把它 hoist 进 <head>（不再只是留在 body），随 HTML 首字节即可套用，
// 与 viewport.colorScheme 的 meta 形成「双保险」，彻底消除刷新时的白底闪烁（FOUC）。
const CRITICAL_CSS = ":root{color-scheme:light dark}" + "@media (prefers-color-scheme:dark){html{background-color:#0a0a0a;color:#ededed}}" + "@media (prefers-color-scheme:light){html{background-color:#ffffff}}"

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

// Next 16：viewport.colorScheme 会在 SSR <head> 内联 <meta name="color-scheme" content="light dark">，
// 浏览器首屏解析 HTML 即生效，深色模式刷新不再闪白（FOUC）。这是 GitHub 等站点的标准做法。
export const viewport = {
  colorScheme: "light dark",
}

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
        <style href="cookmate-critical-css" precedence="critical">{CRITICAL_CSS}</style>
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
