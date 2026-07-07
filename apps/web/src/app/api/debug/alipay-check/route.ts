import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { queryOrder, isAlipayConfigured } from "@cookmate/shared/api/alipay-pay"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  if (!isAlipayConfigured()) {
    return NextResponse.json({ error: "支付宝未配置" }, { status: 503 })
  }

  const pendingOrders = await prisma.paymentOrder.findMany({
    where: { userId: session.user.id, channel: "alipay", status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  const result: Record<string, unknown> = {
    userId: session.user.id,
    alipay_configured: true,
    orders_count: pendingOrders.length,
    results: [] as Array<Record<string, unknown>>,
  }

  if (pendingOrders.length === 0) {
    result.message = "没有 PENDING 的支付宝订单"
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true, subscriptionExpiryDate: true },
    })
    result.current_status = {
      subscriptionTier: user?.subscriptionTier,
      subscriptionExpiryDate: user?.subscriptionExpiryDate?.toISOString() ?? null,
    }
    return NextResponse.json(result)
  }

  const processed: Array<Record<string, unknown>> = []

  for (const order of pendingOrders) {
    const entry: Record<string, unknown> = {
      orderId: order.orderId,
      createdAt: order.createdAt.toISOString(),
    }

    try {
      const status = await queryOrder(order.orderId)
      entry.alipay_status = status

      if (status.paid) {
        await prisma.paymentOrder.update({
          where: { id: order.id },
          data: { status: "PAID" },
        })
        entry.order_updated = true

        const expiryDate = new Date()
        expiryDate.setUTCMonth(expiryDate.getUTCMonth() + 1)
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            subscriptionTier: "PRO",
            subscriptionExpiryDate: expiryDate,
          },
        })
        entry.user_upgraded = true
      } else {
        entry.message = "支付宝显示该订单未支付"
      }
    } catch (err: unknown) {
      entry.error = err instanceof Error ? err.message : String(err)
    }

    processed.push(entry)
  }

  result.results = processed

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true, subscriptionExpiryDate: true },
  })
  result.current_status = {
    subscriptionTier: user?.subscriptionTier,
    subscriptionExpiryDate: user?.subscriptionExpiryDate?.toISOString() ?? null,
  }

  return NextResponse.json(result)
}