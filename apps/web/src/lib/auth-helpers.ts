import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isExpired } from "@cookmate/shared/utils/subscription"
import { STARRED_RECIPE_LIMIT, RECIPE_COUNT_LIMIT, PANTRY_ITEM_LIMIT, MEAL_PLAN_DAYS_LIMIT } from "@cookmate/shared/constants/usage-limits"

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
 * 检查用户是否为免费版（订阅已过期视为免费）
 */
export async function isFreeUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return true
  if (user.subscriptionTier !== "FREE") return false
  if (user.subscriptionExpiryDate && !isExpired(user.subscriptionExpiryDate)) return false
  return true
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
 * 检查免费版食材库上限
 * @returns true 表示受限（已达上限），false 表示可继续
 */
export async function checkPantryLimit(userId: string): Promise<boolean> {
  const count = await prisma.pantryItem.count({ where: { userId } })
  return count >= PANTRY_ITEM_LIMIT
}

/**
 * 免费版周计划天数限制检查（≤3天）
 * PRO 用户或已达上限返回 false，超过返回 true
 */
export async function checkMealPlanDaysLimit(userId: string): Promise<boolean> {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  // 查询本周所有 meal plan 的 ID，再查其 slots 去重天数
  const plans = await prisma.mealPlan.findMany({
    where: { userId, weekStart: { gte: monday, lte: sunday } },
    select: { id: true },
  })
  if (plans.length === 0) return false

  const planIds = plans.map((p: { id: string }) => p.id)
  const slots = await prisma.mealSlot.findMany({
    where: { mealPlanId: { in: planIds } },
    select: { dayOfWeek: true },
  })
  const days = new Set(slots.map((s: { dayOfWeek: number }) => s.dayOfWeek))
  return days.size >= MEAL_PLAN_DAYS_LIMIT
}

export async function checkUsageLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  if (!user) return false

  // 已过期的高级订阅视为 FREE，强制执行每日生成上限（原实现忽略过期日期）
  const expired = user.subscriptionExpiryDate != null && isExpired(user.subscriptionExpiryDate)
  if (user.subscriptionTier !== "FREE" && !expired) return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const usage = await prisma.usageDaily.findUnique({
    where: { userId_date: { userId, date: today } },
  })
  return (usage?.recipeCount ?? 0) < 1
}

export async function incrementUsage(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await prisma.usageDaily.upsert({
    where: { userId_date: { userId, date: today } },
    update: { recipeCount: { increment: 1 } },
    create: { userId, date: today, recipeCount: 1 },
  })
}
