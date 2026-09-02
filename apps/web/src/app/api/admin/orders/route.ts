import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

// 管理员专用：订单列表（全部渠道，含月付/年付 period），供后台「订单」Tab 展示。
// 鉴权见 requireAdmin（ADMIN_EMAIL 白名单，fail-closed）。
export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const orders = await prisma.paymentOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true } } },
  })

  const parsed = orders.map((o) => ({
    id: o.id,
    orderId: o.orderId,
    channel: o.channel, // "creem" | "alipay"
    period: o.period, // "monthly" | "annual" | null（历史订单可能为空）
    amount: o.amount, // 分
    status: o.status, // PENDING / PAID / EXPIRED
    createdAt: o.createdAt,
    userEmail: o.user?.email ?? null,
  }))

  const paid = parsed.filter((o) => o.status === "PAID")
  const totalRevenue = paid.reduce((sum, o) => sum + o.amount, 0)

  return NextResponse.json({
    total: parsed.length,
    paidCount: paid.length,
    totalRevenue,
    orders: parsed,
  })
}
