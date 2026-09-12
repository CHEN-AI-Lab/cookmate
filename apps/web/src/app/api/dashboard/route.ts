import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"
import { isAlipayConfigured } from "@cookmate/shared/api/alipay-pay"
import { isCreemConfigured } from "@cookmate/shared/api/creem"
import { isDemoUser } from "@/lib/auth-helpers"
import { effectiveTier, isPaidTier } from "@cookmate/shared/utils/subscription"
import { SUBSCRIPTION_TIER } from "@cookmate/shared/constants"

async function checkSubscription(userId: string, user: { subscriptionTier: string; subscriptionExpiryDate: Date | null } | null): Promise<string> {
  if (!user) return SUBSCRIPTION_TIER.FREE
  // 用 effectiveTier：① 到期即按免费算（与后端额度限制、与后台同一个口径）；
  // ② 非 FREE 的付费档（PRO / FAMILY）原样返回 —— 以前硬比 PRO，家庭版会显示成免费版。
  return effectiveTier(user.subscriptionTier, user.subscriptionExpiryDate)
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
    // 「已取消订阅」= 付费档但没有 Creem 订阅ID（取消后本地会清空该ID，保留 PRO 到到期日）。
    // 用 isPaidTier 而不是硬比 PRO：FAMILY 等付费档同样适用。
    const canceled = isPaidTier(tier) && !user?.creemSubscriptionId

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