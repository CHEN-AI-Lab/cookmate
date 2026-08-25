import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isExpired } from "@cookmate/shared/utils/subscription"

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