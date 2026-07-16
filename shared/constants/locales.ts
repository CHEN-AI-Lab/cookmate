// ─── Locale Configuration ───
// Single source of truth for supported languages.
// All platforms (Web, MiniProgram, App, Desktop) read from here.

export const locales = ['zh-CN', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'