import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { queryPaymentOrder } from "@cookmate/shared/api/payment"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  try {
    const { payjsOrderId } = await req.json()
    if (!payjsOrderId) {
      return NextResponse.json({ error: "缺少订单号" }, { status: 400 })
    }

    const result = await queryPaymentOrder(payjsOrderId)

    if (result.paid) {
      // 更新订单状态
      await prisma.paymentOrder.updateMany({
        where: { payjsOrderId, userId: session.user.id, status: "PENDING" },
        data: { status: "PAID" },
      })

      // 升级用户（30 天订阅）
      const now = new Date()
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          subscriptionTier: "PRO",
          subscriptionExpiryDate: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
        },
      })
    }

    return NextResponse.json({ paid: result.paid })
  } catch (error: any) {
    console.error("Payment verify error:", error)
    return NextResponse.json(
      { error: error?.message || "查询订单失败" },
      { status: 500 }
    )
  }
}