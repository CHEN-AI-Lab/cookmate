// ─── Locale Configuration ───
// Single source of truth for supported languages.
// All platforms (Web, MiniProgram, App, Desktop) read from here.

export const locales = ['en', 'zh-CN', 'zh-TW', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

// Display names for each locale in its own language
export const localeNames: Record<string, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ja': '日本語',
  'en': 'English',
}

/**
 * 是否中文语系（zh-CN / zh-TW）。
 *
 * 体验模式的语言口径唯一判定入口：**中文语系用中文，其余语言（en / ja 等）一律英文**。
 * 禁止再写 `locale === "en"`（ja 会掉回中文）或 `locale === "zh-CN"`（zh-TW 会掉回英文）。
 */
export function isChineseLocale(locale: string): boolean {
  return typeof locale === "string" && locale.startsWith("zh")
}
