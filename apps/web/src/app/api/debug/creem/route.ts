import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 诊断接口：查看 Creem 配置状态和当前用户信息
 * 不验证任何东西，纯粹为了排查问题
 */
export async function GET() {
  const session = await auth()
  const result: Record<string, unknown> = {
    has_session: !!session,
  }

  // Creem 环境变量
  result.creem = {
    api_key_set: !!process.env.CREEM_API_KEY,
    api_key_prefix: process.env.CREEM_API_KEY
      ? (process.env.CREEM_API_KEY.startsWith("creem_test_") ? "creem_test_" : "creem_live_")
      : "未配置",
    product_id_set: !!process.env.CREEM_PRODUCT_ID,
    webhook_secret_set: !!process.env.CREEM_WEBHOOK_SECRET,
  }

  // 最新的 webhook 日志
  const webhookLogs = await prisma.webhookLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  result.webhook_logs = webhookLogs.map((l) => ({
    id: l.id,
    source: l.source,
    eventType: l.eventType,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
  }))

  // 当前用户
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionExpiryDate: true,
      },
    })
    result.user = user
      ? {
          id: user.id,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          subscriptionExpiryDate: user.subscriptionExpiryDate?.toISOString() ?? null,
        }
      : null

    // 最近的 payment orders
    const orders = await prisma.paymentOrder.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
    result.recent_orders = orders.map((o) => ({
      id: o.id,
      orderId: o.orderId,
      channel: o.channel,
      status: o.status,
      amount: o.amount,
      createdAt: o.createdAt.toISOString(),
    }))
  }

  return NextResponse.json(result)
}