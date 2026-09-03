import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

// 管理员专用：用户列表（注册用户、套餐、到期时间、注册日期）。
// 鉴权见 requireAdmin（ADMIN_EMAILS 白名单，fail-closed）。
export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
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
  })

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

  const proCount = parsed.filter((u) => u.subscriptionTier === "PRO").length
  const freeCount = parsed.filter((u) => u.subscriptionTier === "FREE").length

  return NextResponse.json({
    total: parsed.length,
    proCount,
    freeCount,
    users: parsed,
  })
}
