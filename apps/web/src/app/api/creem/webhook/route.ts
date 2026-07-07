import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("creem-signature") || ""
    const body = await req.text()

    // 验证签名
    const { verifyWebhook } = await import("@cookmate/shared/api/creem")
    if (!verifyWebhook(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)

    // 处理支付成功事件
    if (event.eventType === "checkout.completed") {
      const data = event.data || event
      const userId = data.metadata?.userId
      const creemOrderId = data.id || data.order_id

      if (!userId) {
        return NextResponse.json({ error: "Missing userId in metadata" }, { status: 400 })
      }

      // 查找或创建订单记录
      const existingOrder = await prisma.paymentOrder.findFirst({
        where: { orderId: creemOrderId },
      })

      if (!existingOrder) {
        await prisma.paymentOrder.create({
          data: {
            userId,
            orderId: creemOrderId,
            channel: "creem",
            amount: 1500,
            status: "PAID",
          },
        })
      } else if (existingOrder.status !== "PAID") {
        await prisma.paymentOrder.update({
          where: { id: existingOrder.id },
          data: { status: "PAID" },
        })
      }

      // 更新用户订阅
      const expiryDate = new Date()
      expiryDate.setUTCMonth(expiryDate.getUTCMonth() + 1)

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: "PRO",
          subscriptionExpiryDate: expiryDate,
        },
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error("Creem webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}