// ─── Meal Plan Constants ───
// 中英文星期/餐次 key 常量，用于膳食规划器

export const DAY_KEYS_ZH = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const
export const DAY_KEYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

export const MEAL_KEYS_ZH = ["早餐", "午餐", "晚餐"] as const
export const MEAL_KEYS_EN = ["breakfast", "lunch", "dinner"] as const

/** 根据 locale 返回星期 key 数组 */
export function getDayKeys(locale: string): readonly string[] {
  return locale === "en" ? DAY_KEYS_EN : DAY_KEYS_ZH
}

/** 根据 locale 返回餐次 key 数组 */
export function getMealKeys(locale: string): readonly string[] {
  return locale === "en" ? MEAL_KEYS_EN : MEAL_KEYS_ZH
}