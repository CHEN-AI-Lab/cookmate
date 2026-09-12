// ─── Meal Plan API Utilities ───
// 膳食规划 API 路由的辅助函数

import { pickLocaleText, isChineseLocale } from "@cookmate/shared/constants/locales"

/** 根据 locale 返回对应语言的错误消息（口径统一走 pickLocaleText） */
export function errMsg(locale: string, zh: string, en: string): string {
  return pickLocaleText(locale, zh, en)
}

/** locale 感知的星期名 → 索引映射 */
export function getDayMap(locale: string): Record<string, number> {
  return isChineseLocale(locale)
    ? { "周一": 0, "周二": 1, "周三": 2, "周四": 3, "周五": 4, "周六": 5, "周日": 6 }
    : { "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6 }
}