import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

// Global metadata — title.default is used when no page-level metadata exists,
// title.template appends "— CookMate" to page-level titles.
export const metadata: Metadata = {
  title: {
    default: "CookMate",
    template: "%s — CookMate",
  },
  icons: { icon: "/favicon.svg" },
}

// Since we have app/not-found.tsx and app/page.tsx on the root, a layout file
// is required. The actual <html> and <body> tags are rendered by
// [locale]/layout.tsx, which has access to the locale param.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
