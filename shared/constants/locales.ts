// ─── Locale Configuration ───
// Single source of truth for supported languages.
// All platforms (Web, MiniProgram, App, Desktop) read from here.

export const locales = ['zh-CN', 'en', 'ja', 'ko', 'vi', 'th'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

// Display names for each locale in its own language
export const localeNames: Record<string, string> = {
  'zh-CN': '中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
  'vi': 'Tiếng Việt',
  'th': 'ไทย',
}