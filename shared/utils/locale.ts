// 从请求 Cookie 中读取语言，用于 API 路由返回错误消息
export function getLocaleFromCookie(req: Request): string {
  const cookieHeader = req.headers.get("cookie") || ""
  const match = cookieHeader.match(/NEXT_LOCALE=([^;]+)/)
  return match?.[1] || "zh-CN"
}

export function e(locale: string, zh: string, en: string): string {
  return locale === "en" || locale.startsWith("en") ? en : zh
}
/** @deprecated Use e() instead */
export const t = e