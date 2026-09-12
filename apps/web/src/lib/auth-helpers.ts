import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isExpired, effectiveTier } from "@cookmate/shared/utils/subscription"
import { STARRED_RECIPE_LIMIT, RECIPE_COUNT_LIMIT, PANTRY_ITEM_LIMIT, MEAL_PLAN_DAYS_LIMIT, AI_DAILY_LIMIT } from "@cookmate/shared/constants/usage-limits"
import { SUBSCRIPTION_TIER } from "@cookmate/shared/constants"

/**
 * Demo 用户识别常量（避免散落硬编码）
 * 用于：拦截 demo 用户下单 / 屏蔽 demo 用户看到 PRO 专属功能等
 * 若未来新增 demo 账号：仅需扩这两个数组
 */
const DEMO_USER_IDS = ["demo-user-id"] as const
const DEMO_USER_EMAILS = ["demo@cookmate.local"] as const

export function isDemoUser(session: unknown): boolean {
  if (!session || typeof session !== "object") return false
  const s = session as { user?: { id?: unknown; email?: unknown } }
  const uid = typeof s.user?.id === "string" ? s.user.id : ""
  const email = typeof s.user?.email === "string" ? s.user.email : ""
  return (uid !== "" && DEMO_USER_IDS.includes(uid as typeof DEMO_USER_IDS[number])) ||
         (email !== "" && DEMO_USER_EMAILS.includes(email as typeof DEMO_USER_EMAILS[number]))
}

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user
}

/**
 * 检查用户是否为免费版（**到期感知**）
 *
 * 不能用数据库字段直接判：降级由 /api/cron/expire-sweep 负责（每天 UTC 00:00 = 北京 08:00，
 * 且只有正式环境会跑，preview 永远不跑）。在这段窗口里用户页面（dashboard 的 checkSubscription）
 * 已经按到期日实时算、显示免费版了；这里若还按字段把用户当 PRO，就变成「页面说免费、功能照给」。
 * 统一走 effectiveTier()，和页面、和 AI 生成接口用同一套判断。
 */
export async function isFreeUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return true
  // 到期日还在未来 → 付费期有效，不算免费（含「tier 已降级但到期日未清空」这种中间态）
  if (user.subscriptionExpiryDate && !isExpired(user.subscriptionExpiryDate)) return false
  return effectiveTier(user.subscriptionTier, user.subscriptionExpiryDate) === SUBSCRIPTION_TIER.FREE
}

/**
 * 检查免费版收藏上限
 * @returns true 表示受限（已达上限），false 表示可继续
 */
export async function checkStarredLimit(userId: string): Promise<boolean> {
  const count = await prisma.recipe.count({ where: { userId, starred: true } })
  return count >= STARRED_RECIPE_LIMIT
}

/**
 * 检查免费版总菜谱数上限
 * @returns true 表示受限（已达上限），false 表示可继续
 */
export async function checkRecipeCountLimit(userId: string): Promise<boolean> {
  const count = await prisma.recipe.count({ where: { userId } })
  return count >= RECIPE_COUNT_LIMIT
}

/**
 * 免费版总菜谱数上限检查（批量写入场景）
 * 与 checkRecipeCountLimit 的区别：周计划这类一次写入多条的接口，
 * 只看「当前是否已满」会放行「已有 20 个再写 9 个 = 29」的越限写入。
 * @param incoming 本次预计新增的菜谱条数
 * @returns true 表示预计越限，false 表示可继续
 */
export async function checkRecipeCountLimitForCount(userId: string, incoming: number): Promise<boolean> {
  const count = await prisma.recipe.count({ where: { userId } })
  return count + incoming > RECIPE_COUNT_LIMIT
}

/**
 * 检查免费版食材库上限
 * @returns true 表示受限（已达上限），false 表示可继续
 */
export async function checkPantryLimit(userId: string): Promise<boolean> {
  const count = await prisma.pantryItem.count({ where: { userId } })
  return count >= PANTRY_ITEM_LIMIT
}

/**
 * 查询本周周计划已占用的去重天数集合（0=周一…6=周日）
 * AI 批量生成和手动添加共用，避免两处重复算周一/周日的逻辑。
 */
export async function getCurrentWeekPlanDays(userId: string): Promise<Set<number>> {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const plans = await prisma.mealPlan.findMany({
    where: { userId, weekStart: { gte: monday, lte: sunday } },
    select: { id: true },
  })
  if (plans.length === 0) return new Set()

  const planIds = plans.map((p: { id: string }) => p.id)
  const slots = await prisma.mealSlot.findMany({
    // 必须过滤掉 recipeId 为空的槽位：删除菜谱时只把 recipeId 置 null、MealSlot 记录仍保留，
    // 若把这类空槽算作占用，会出现「前端显示还有额度、后端却返回 403」的割裂。
    where: { mealPlanId: { in: planIds }, recipeId: { not: null } },
    select: { dayOfWeek: true },
  })
  return new Set(slots.map((s: { dayOfWeek: number }) => s.dayOfWeek))
}

/**
 * 免费版周计划天数上限检查（≤3天）
 * 仅看本周已落库天数，用于「手动添加单个槽位」这类增量写入场景。
 * @returns true 表示已达上限
 */
export async function checkMealPlanDaysLimit(userId: string): Promise<boolean> {
  const days = await getCurrentWeekPlanDays(userId)
  return days.size >= MEAL_PLAN_DAYS_LIMIT
}

/**
 * 免费版周计划「本次批量生成」上限检查
 * 与 checkMealPlanDaysLimit 的区别：这里要算「本周已占用天数 ∪ 本次新增天数」，
 * 否则会放行"第一次就选 7 天"的绕过（已落库 0 天，checkMealPlanDaysLimit 永远返回 false）。
 * @param targetDays 本次要生成的天数索引数组（0=周一…6=周日）
 * @returns true 表示并集超限，false 表示可继续
 */
export async function checkMealPlanDaysLimitForDays(userId: string, targetDays: number[]): Promise<boolean> {
  const existing = await getCurrentWeekPlanDays(userId)
  const union = new Set([...existing, ...targetDays])
  return union.size > MEAL_PLAN_DAYS_LIMIT
}

/**
 * 免费版每日 AI 调用额度是否还有剩余。
 * 注意返回值语义与 check*Limit 系列相反：这里 true = 还能用，那系列 true = 已超限。
 * 命名用 can 开头就是为了不跟它们混淆。
 *
 * 菜谱生成与周计划生成**共用同一个每日计数器**（设计决定，不要拆开）。
 * @returns true 表示今日仍有额度，false 表示已用完
 */
export async function canUseAiToday(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  if (!user) return false

  // **到期感知**：tier 还是 PRO 但到期日已过 → 按免费版扣每日额度。
  // 以前这里直接判 subscriptionTier 字段，导致过期用户在定时任务跑之前一直拿「无限额度」，
  // 而用户页面早就显示免费版了 —— 就是那次的「过期了还能无限生成」。
  if (effectiveTier(user.subscriptionTier, user.subscriptionExpiryDate) !== SUBSCRIPTION_TIER.FREE) return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const usage = await prisma.usageDaily.findUnique({
    where: { userId_date: { userId, date: today } },
  })
  return (usage?.recipeCount ?? 0) < AI_DAILY_LIMIT
}

/**
 * 累加当日 AI 用量（菜谱生成与周计划生成共用同一计数器，此为设计决定，不要拆开）。
 */
export async function incrementAiUsage(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await prisma.usageDaily.upsert({
    where: { userId_date: { userId, date: today } },
    update: { recipeCount: { increment: 1 } },
    create: { userId, date: today, recipeCount: 1 },
  })
}
