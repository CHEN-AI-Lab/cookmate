// ─── CookMate Locale Configuration ───
// Single source of truth for supported languages.
// All platforms (Web, MiniProgram, App) read from here.

export type MessageLocale = 'zh-CN' | 'en'

export const locales = ['zh-CN', 'en'] as const
export const defaultLocale = 'zh-CN' as const
export type Messages = typeof import('../messages/zh-CN.json')