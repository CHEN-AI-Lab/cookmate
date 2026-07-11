import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getLocale } from "next-intl/server"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

export const metadata: Metadata = {
  title: "CookMate — AI 智能食谱 & 餐食规划",
  description: "告诉我你有什么食材，3秒生成菜谱。每周计划+购物清单，从此不再纠结今天吃什么。",
  icons: { icon: "/favicon.svg" },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

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
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}