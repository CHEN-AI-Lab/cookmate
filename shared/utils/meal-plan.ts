// ─── Meal Plan API Utilities ───
// 膳食规划 API 路由的辅助函数

/** 根据 locale 返回对应语言的错误消息 */
export function errMsg(locale: string, zh: string, en: string): string {
  return locale === "en" ? en : zh
}

/** locale 感知的星期名 → 索引映射 */
export function getDayMap(locale: string): Record<string, number> {
  return locale === "en"
    ? { "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6 }
    : { "周一": 0, "周二": 1, "周三": 2, "周四": 3, "周五": 4, "周六": 5, "周日": 6 }
}