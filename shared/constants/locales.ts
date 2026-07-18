// ─── Locale Configuration ───
// Single source of truth for supported languages.
// All platforms (Web, MiniProgram, App, Desktop) read from here.

export const locales = ['zh-CN', 'zh-TW', 'ja', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

// Display names for each locale in its own language
export const localeNames: Record<string, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ja': '日本語',
  'en': 'English',
}