// 从请求 Cookie 中读取语言，用于 API 路由返回错误消息
export function getLocaleFromCookie(req: Request): string {
  const cookieHeader = req.headers.get("cookie") || ""
  const match = cookieHeader.match(/NEXT_LOCALE=([^;]+)/)
  return match?.[1] || "zh-CN"
}

// 双语错误消息（旧方式，逐步替换为 err()）
export function e(locale: string, zh: string, en: string): string {
  return locale === "en" || locale.startsWith("en") ? en : zh
}
/** @deprecated Use e() instead */
export const t = e

// 从 JSON 翻译文件中读取错误消息
import zhMessages from "@cookmate/shared/messages/zh-CN.json"
import enMessages from "@cookmate/shared/messages/en.json"

const msgCache: Record<string, Record<string, string>> = {
  zh: (zhMessages as any).errors || {},
  en: (enMessages as any).errors || {},
}

export function err(locale: string, key: string): string {
  const lang = locale?.startsWith("en") ? "en" : "zh"
  return msgCache[lang]?.[key] || key
}