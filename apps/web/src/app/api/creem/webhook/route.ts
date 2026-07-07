import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 从事件中提取 userId（metadata 在不同事件类型中位置不同）
function extractUserId(event: Record<string, unknown>): string | null {
  // subscription.active — metadata 在顶层
  if (event.metadata && typeof event.metadata === "object") {
    const meta = event.metadata as Record<string, unknown>
    if (typeof meta.userId === "string") return meta.userId
  }
  // checkout.completed — 可能在 event.data 里
  if (event.data && typeof event.data === "object") {
    const d = event.data as Record<string, unknown>
    if (d.metadata && typeof d.metadata === "object") {
      const meta = d.metadata as Record<string, unknown>
      if (typeof meta.userId === "string") return meta.userId
    }
  }
  return null
}

function extractOrderId(event: Record<string, unknown>): string | null {
  if (typeof event.id === "string") return event.id
  if (event.data && typeof event.data === "object") {
    const d = event.data as Record<string, unknown>
    if (typeof d.id === "string") return d.id
  }
  return null
}

async function upgradeUser(userId: string) {
  const expiryDate = new Date()
  expiryDate.setUTCMonth(expiryDate.getUTCMonth() + 1)

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: "PRO",
      subscriptionExpiryDate: expiryDate,
    },
  })
}

async function recordOrder(userId: string, orderId: string) {
  const existing = await prisma.paymentOrder.findFirst({
    where: { orderId },
  })

  if (!existing) {
    await prisma.paymentOrder.create({
      data: {
        userId,
        orderId,
        channel: "creem",
        amount: 1500,
        status: "PAID",
      },
    })
  } else if (existing.status !== "PAID") {
    await prisma.paymentOrder.update({
      where: { id: existing.id },
      data: { status: "PAID" },
    })
  }
}

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

    // checkout.completed — 订单完成，不一定有 metadata
    if (event.eventType === "checkout.completed") {
      const userId = extractUserId(event)
      const orderId = extractOrderId(event) || ""
      if (userId && orderId) {
        await recordOrder(userId, orderId)
      }
      // 不在此处升级用户，等 subscription.active 事件
      return NextResponse.json({ success: true })
    }

    // subscription.active — 订阅激活，此时 metadata 可用
    if (event.eventType === "subscription.active") {
      const userId = extractUserId(event)
      if (!userId) {
        return NextResponse.json({ error: "Missing userId in metadata" }, { status: 400 })
      }
      await upgradeUser(userId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error("Creem webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}