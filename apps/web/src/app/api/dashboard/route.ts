import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isPaymentConfigured } from "@/lib/payment"
import { isAlipayConfigured } from "@/lib/alipay-pay"

// 检查订阅是否过期，过期自动降级
async function checkSubscription(userId: string, user: { subscriptionTier: string; subscriptionExpiryDate: Date | null } | null): Promise<string> {
  if (!user || user.subscriptionTier !== "PRO") return "FREE"
  if (!user.subscriptionExpiryDate) return "PRO" // 无到期日的视为永久
  if (new Date() > user.subscriptionExpiryDate) {
    // 已过期，自动降级
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: "FREE", subscriptionExpiryDate: null },
    }).catch(() => {})
    return "FREE"
  }
  return "PRO"
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    const userId = session.user.id

    const [pantryCount, starredCount, mealPlanCount, usage] = await Promise.all([
      prisma.pantryItem.count({ where: { userId } }).catch(() => 0),
      prisma.recipe.count({ where: { userId, starred: true } }).catch(() => 0),
      prisma.mealPlan.count({ where: { userId } }).catch(() => 0),
      prisma.usageDaily.findUnique({
        where: {
          userId_date: {
            userId,
            date: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })(),
          },
        },
      }).catch(() => null),
    ])

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscriptionExpiryDate: true },
    }).catch(() => null)

    const tier = await checkSubscription(userId, user)

    return NextResponse.json({
      pantryCount,
      starredCount,
      mealPlanCount,
      todayUsage: usage?.recipeCount ?? 0,
      subscriptionTier: tier,
      stripeConfigured: !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      paymentConfigured: isPaymentConfigured() || isAlipayConfigured(),
    })
  } catch (error) {
    console.error("Dashboard GET:", error)
    return NextResponse.json({ error: "请求失败，请稍后重试" }, { status: 500 })
  }
}