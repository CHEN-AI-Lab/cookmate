import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"
import { SUBSCRIPTION_TIER } from "@cookmate/shared/constants"
import { parsePage, parsePageSize, parseListParam, parseDateRange } from "@cookmate/shared/utils/admin-query"

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
        onboardingCompleted: true,
        createdAt: true,
        _count: {
          select: { paymentOrders: true },
        },
      },
    }),
    prisma.user.count({ where: { ...where, subscriptionTier: SUBSCRIPTION_TIER.PRO } }),
    prisma.user.count({ where: { ...where, subscriptionTier: SUBSCRIPTION_TIER.FREE } }),
  ])

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
