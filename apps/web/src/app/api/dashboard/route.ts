import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isPaymentConfigured } from "@/lib/payment"

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
      select: { subscriptionTier: true },
    }).catch(() => null)

    return NextResponse.json({
      pantryCount,
      starredCount,
      mealPlanCount,
      todayUsage: usage?.recipeCount ?? 0,
      subscriptionTier: user?.subscriptionTier ?? "FREE",
      stripeConfigured: !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      paymentConfigured: isPaymentConfigured(),
    })
  } catch (error) {
    console.error("Dashboard GET:", error)
    return NextResponse.json({ error: "请求失败，请稍后重试" }, { status: 500 })
  }
}