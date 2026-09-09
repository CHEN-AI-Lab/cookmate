import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"
import { isAlipayConfigured } from "@cookmate/shared/api/alipay-pay"
import { isCreemConfigured } from "@cookmate/shared/api/creem"
import { isDemoUser } from "@/lib/auth-helpers"
import { isExpired } from "@cookmate/shared/utils/subscription"
import { SUBSCRIPTION_TIER } from "@cookmate/shared/constants"

async function checkSubscription(userId: string, user: { subscriptionTier: string; subscriptionExpiryDate: Date | null } | null): Promise<string> {
  if (!user || user.subscriptionTier?.toUpperCase() !== SUBSCRIPTION_TIER.PRO) return SUBSCRIPTION_TIER.FREE
  if (!user.subscriptionExpiryDate) return SUBSCRIPTION_TIER.PRO // 无到期日的视为永久
  if (isExpired(user.subscriptionExpiryDate)) {
    // 已过期 —— 只读返回 FREE，降级由 scripts/expire-sweep.mjs 定时任务处理
    // （GET 端点不再写库，符合 REST 语义；UI 上提示「已过期，等待后台降级」）
    return SUBSCRIPTION_TIER.FREE
  }
  return SUBSCRIPTION_TIER.PRO
}

export async function GET(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: err(loc, "loginRequired") }, { status: 401 })

    const userId = session.user.id

    const [pantryCount, starredCount, mealPlanCount, usage] = await Promise.all([
      prisma.pantryItem.count({ where: { userId } }).catch((err: unknown) => { console.error("count pantry items error:", err); return 0 }),
      prisma.recipe.count({ where: { userId, starred: true } }).catch((err: unknown) => { console.error("count starred recipes error:", err); return 0 }),
      prisma.mealPlan.count({ where: { userId } }).catch((err: unknown) => { console.error("count meal plans error:", err); return 0 }),
      prisma.usageDaily.findUnique({
        where: {
          userId_date: {
            userId,
            date: (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })(),
          },
        },
      }).catch((err: unknown) => { console.error("findUnique usage error:", err); return null }),
    ])

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscriptionExpiryDate: true, subscriptionPeriod: true, creemSubscriptionId: true },
    }).catch((err: unknown) => { console.error("findUnique user error:", err); return null })

    const tier = await checkSubscription(userId, user)
    // 仅当为 PRO 且不存在有效订阅记录时才视为已取消。
    const canceled = tier === SUBSCRIPTION_TIER.PRO && !user?.creemSubscriptionId

    // 查最近一笔 PAID 订单的渠道和周期，用于前端区分按钮显示
    const lastPaidOrder = await prisma.paymentOrder.findFirst({
      where: { userId, status: "PAID" },
      orderBy: { createdAt: "desc" },
      select: { channel: true, period: true },
    }).catch(() => null)
    const paymentChannel = lastPaidOrder?.channel ?? null
    // 周期读取（方案A）：优先 User.subscriptionPeriod（webhook 支付成功时写入的权威字段），
    // 历史用户无该字段时兜底反查最近一笔 PAID 订单的 period
    const subscriptionPeriod = user?.subscriptionPeriod ?? lastPaidOrder?.period ?? null

    // 最近订单
    const orders = await prisma.paymentOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({
      pantryCount,
      starredCount,
      mealPlanCount,
      todayUsage: usage?.recipeCount ?? 0,
      subscriptionTier: tier,
      canceled,
      paymentChannel,
      subscriptionPeriod,
      subscriptionExpiryDate: user?.subscriptionExpiryDate?.toISOString() ?? null,
      paymentConfigured: isAlipayConfigured(),
      creemConfigured: isCreemConfigured(),
      orders: orders.map((o) => ({
        id: o.id,
        orderId: o.orderId,
        channel: o.channel,
        amount: o.amount,
        currency: o.currency,
        paidAmount: o.paidAmount,
        paidCurrency: o.paidCurrency,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      isDemoUser: isDemoUser(session),
    })
  } catch (error) {
    console.error("Dashboard GET:", error)
    return NextResponse.json({ error: err(loc, "requestFailed") }, { status: 500 })
  }
}