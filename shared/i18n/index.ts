// ─── CookMate 通用翻译加载器 ───
// 跨平台可用（Web / 小程序 / App）
// Web 端另有 next-intl 包装，其他端直接使用此函数

import zhCN from '../messages/zh-CN.json' with { type: 'json' }
import en from '../messages/en.json' with { type: 'json' }

const messageMap: Record<string, Record<string, unknown>> = {
  'zh-CN': zhCN as Record<string, unknown>,
  'en': en as Record<string, unknown>,
}

/**
 * 根据语言和 key 路径获取翻译文本。
 * @param locale - 语言代码，如 'zh-CN' 或 'en'
 * @param path - 点分隔的 key 路径，如 'home.title'
 * @param fallback - 可选兜底文本，缺省时返回 key 本身
 */
export function t(locale: string, path: string, fallback?: string): string {
  const msg = messageMap[locale] || messageMap['zh-CN']
  if (!msg) return fallback ?? path

  const keys = path.split('.')
  let val: unknown = msg
  for (const key of keys) {
    if (val && typeof val === 'object' && key in val) {
      val = (val as Record<string, unknown>)[key]
    } else {
      return fallback ?? path
    }
  }
  return typeof val === 'string' ? val : (fallback ?? path)
}