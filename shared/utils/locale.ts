// 简单的中英文切换工具
export function t(locale: string | undefined | null, zh: string, en: string): string {
  if (locale === "en" || locale?.startsWith("en")) return en
  return zh
}