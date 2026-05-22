import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CookMate — AI 智能食谱 & 餐食规划",
  description: "告诉我你有什么食材，3秒生成菜谱。每周计划+购物清单，从此不再纠结今天吃什么。",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}