import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"
import { SUBSCRIPTION_TIER } from "@cookmate/shared/constants"
import { parsePage, parsePageSize, parseListParam, parseDateRange, deriveSubscriptionStatus } from "@cookmate/shared/utils/admin-query"
import { isPaidTier } from "@cookmate/shared/utils/subscription"

// 管理员专用：用户列表（注册用户、套餐、到期时间、注册日期）。
// 鉴权见 requireAdmin（ADMIN_EMAILS 白名单，fail-closed）。
//
// 分页 + 列筛选：email / name（模糊）、tier（多选）、createdAtFrom / createdAtTo。
// proCount / freeCount 跟随筛选；totalAll 是全局值，供 tab 角标用。
export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const { searchParams } = new URL(req.url)
  const page = parsePage(searchParams.get("page"))
  const pageSize = parsePageSize(searchParams.get("pageSize"))

  const email = searchParams.get("email")?.trim()
  const name = searchParams.get("name")?.trim()
  const createdAt = parseDateRange(searchParams.get("createdAtFrom"), searchParams.get("createdAtTo"))

  const where: Prisma.UserWhereInput = {}
  if (createdAt) where.createdAt = createdAt
  if (email) where.email = { contains: email, mode: "insensitive" }
  if (name) where.name = { contains: name, mode: "insensitive" }
  const tiers = parseListParam(searchParams.get("tier"))
  if (tiers.length > 0) where.subscriptionTier = { in: tiers }

  const [total, totalAll, users, proCount, freeCount] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count(),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        subscriptionTier: true,
        subscriptionExpiryDate: true,
        creemSubscriptionId: true,
        creemSubscriptionStatus: true,
        onboardingCompleted: true,
        createdAt: true,
        _count: {
          select: { paymentOrders: true },
        },
      },
    }),
    // 付费档（PRO / FAMILY 等，非 FREE）与免费档 —— 不要硬比 PRO，否则家庭版两边都不计、数字对不上
    prisma.user.count({ where: { ...where, subscriptionTier: { not: SUBSCRIPTION_TIER.FREE } } }),
    prisma.user.count({ where: { ...where, subscriptionTier: SUBSCRIPTION_TIER.FREE } }),
  ])

  // 每个用户最近一笔「已支付」订单的渠道 —— 用来区分「已取消的 Creem 订阅」和「支付宝一次性买断」：
  // 取消后本地会把 creemSubscriptionId 清空，两者在 User 表上长得一样，只能靠支付渠道区分。
  // 只查当前页这 50 个用户，一次批量查（不是逐个查，避免 N+1）。
  const pageUserIds = users.map((u) => u.id)
  const lastPaids = pageUserIds.length
    ? await prisma.paymentOrder.findMany({
        where: { userId: { in: pageUserIds }, status: "PAID" },
        orderBy: { createdAt: "desc" },
        select: { userId: true, channel: true },
      })
    : []
  const lastChannelByUser = new Map<string, string>()
  for (const o of lastPaids) {
    if (!lastChannelByUser.has(o.userId)) lastChannelByUser.set(o.userId, o.channel)
  }

  const parsed = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    subscriptionTier: u.subscriptionTier,
    subscriptionExpiryDate: u.subscriptionExpiryDate?.toISOString() ?? null,
    onboardingCompleted: u.onboardingCompleted,
    createdAt: u.createdAt.toISOString(),
    orderCount: u._count.paymentOrders,
    subStatus: deriveSubscriptionStatus({
      // 是否付费档（PRO / FAMILY 都算）—— 不硬比 PRO，否则家庭版会被当成免费版
      isPaid: isPaidTier(u.subscriptionTier),
      creemSubscriptionId: u.creemSubscriptionId,
      creemSubscriptionStatus: u.creemSubscriptionStatus,
      subscriptionExpiryDate: u.subscriptionExpiryDate,
      lastPaidChannel: lastChannelByUser.get(u.id) ?? null,
    }),
  }))

  return NextResponse.json({
    total,
    totalAll,
    page,
    pageSize,
    proCount,
    freeCount,
    users: parsed,
  })
}
