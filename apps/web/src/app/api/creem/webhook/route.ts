import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 从事件中提取 userId
// Creem webhook payload 结构：
// { "eventType": "xxx", "object": { "metadata": { "userId": "..." }, ... } }
function extractUserId(event: Record<string, unknown>): string | null {
  // checkout.completed — metadata 在 event.object.metadata
  if (event.object && typeof event.object === "object") {
    const obj = event.object as Record<string, unknown>
    if (obj.metadata && typeof obj.metadata === "object") {
      const meta = obj.metadata as Record<string, string>
      if (typeof meta.userId === "string") return meta.userId
    }
    // subscription.active — 订阅对象里也有 metadata
    if (obj.subscription && typeof obj.subscription === "object") {
      const sub = obj.subscription as Record<string, unknown>
      if (sub.metadata && typeof sub.metadata === "object") {
        const meta = sub.metadata as Record<string, string>
        if (typeof meta.userId === "string") return meta.userId
      }
    }
  }
  // 旧格式兜底
  if (event.metadata && typeof event.metadata === "object") {
    const meta = event.metadata as Record<string, string>
    if (typeof meta.userId === "string") return meta.userId
  }
  return null
}

function extractOrderId(event: Record<string, unknown>): string | null {
  // checkout.completed — event.object.id 是 checkout ID
  if (event.object && typeof event.object === "object") {
    const obj = event.object as Record<string, unknown>
    if (typeof obj.id === "string") return obj.id
    // 也可取 order.id
    if (obj.order && typeof obj.order === "object") {
      const o = obj.order as Record<string, unknown>
      if (typeof o.id === "string") return o.id
    }
  }
  // 兜底：event 本身的 id
  if (typeof event.id === "string") return event.id
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

    // checkout.completed — 订单完成
    if (event.eventType === "checkout.completed") {
      const userId = extractUserId(event)
      const orderId = extractOrderId(event) || ""
      if (orderId) {
        await recordOrder(userId || "unknown", orderId)
      }
      // 如果有 userId，立即升级（某些场景只有 checkout.completed 没有 subscription.active）
      if (userId) {
        await upgradeUser(userId)
      }
      return NextResponse.json({ success: true })
    }

    // subscription.active / subscription.paid — 订阅激活/续费
    if (event.eventType === "subscription.active" || event.eventType === "subscription.paid") {
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