// ─── 免费版用量限制常量 ───
// 所有免费用户的限制值在此统一管理，新增限制只需在此处修改。
// PRO 用户不受任何限制。

/** 收藏菜谱上限 */
export const STARRED_RECIPE_LIMIT = 10

/** 总菜谱数上限（含生成 + 手动保存） */
export const RECIPE_COUNT_LIMIT = 25

/** 食材库条目上限 */
export const PANTRY_ITEM_LIMIT = 15

/** 免费版每周周计划最大天数（按天计算，每大=早中晚三个槽） */
export const MEAL_PLAN_DAYS_LIMIT = 3

/** 免费版每日 AI 调用次数（菜谱生成与周计划生成共用同一计数器，此为设计决定） */
export const AI_DAILY_LIMIT = 1
