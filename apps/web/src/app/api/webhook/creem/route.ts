import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PRICING } from "@cookmate/shared/constants/pricing"

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

// 从事件中提取 subscriptionId
function extractSubscriptionId(event: Record<string, unknown>): string | null {
  if (event.object && typeof event.object === "object") {
    const obj = event.object as Record<string, unknown>
    // checkout.completed 的 subscription 字段
    if (obj.subscription && typeof obj.subscription === "object") {
      const sub = obj.subscription as Record<string, unknown>
      if (typeof sub.id === "string") return sub.id
    }
  }
  return null
}

async function upgradeUser(userId: string, creemSubscriptionId?: string) {
  const expiryDate = new Date()
  expiryDate.setUTCMonth(expiryDate.getUTCMonth() + 1)

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: "PRO",
      subscriptionExpiryDate: expiryDate,
      ...(creemSubscriptionId ? { creemSubscriptionId } : {}),
    },
  })
}

async function recordOrder(userId: string, _orderId: string) {
  // 查找这个用户的 PENDING Creem 订单，更新为已支付
  // 不直接用 orderId 查，因为我们的订单号是 CKCR 格式，webhook 拿到的是 ch_xxx
  const existing = await prisma.paymentOrder.findFirst({
    where: { userId, channel: "creem", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  })

  if (existing) {
    await prisma.paymentOrder.update({
      where: { id: existing.id },
      data: { status: "PAID" },
    })
  } else {
    // 兜底：找不到就新建
    await prisma.paymentOrder.create({
      data: {
        userId,
        orderId: _orderId,
        channel: "creem",
        amount: PRICING.plans.monthly.cny.amount,
        status: "PAID",
      },
    })
  }
}

async function logWebhook(source: string, eventType: string | null, status: string, rawBody?: string) {
  try {
    await prisma.webhookLog.create({
      data: { source, eventType, status, rawBody },
    })
  } catch {
    // 日志不要影响主流程
  }
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("creem-signature") || ""
    const body = await req.text()

    // 先记录日志（异步，不阻塞）
    let parsedEvent: Record<string, unknown> = {}
    try { parsedEvent = JSON.parse(body) } catch { /* skip */ }
    const rawEventType = (parsedEvent?.eventType as string) || null
    logWebhook("creem", rawEventType, "received", body)

    // 验证签名
    const { verifyWebhook } = await import("@cookmate/shared/api/creem")
    if (!verifyWebhook(body, signature)) {
      logWebhook("creem", rawEventType, "failed:signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = parsedEvent

    // checkout.completed — 订单完成
    if (event.eventType === "checkout.completed") {
      const userId = extractUserId(event)
      const orderId = extractOrderId(event) || ""
      const subscriptionId = extractSubscriptionId(event)
      if (orderId) {
        await recordOrder(userId || "unknown", orderId)
      }
      if (userId) {
        await upgradeUser(userId, subscriptionId || undefined)
      }
      logWebhook("creem", "checkout.completed", "success")
      return NextResponse.json({ success: true })
    }

    // subscription.active / subscription.paid
    if (event.eventType === "subscription.active" || event.eventType === "subscription.paid") {
      const userId = extractUserId(event)
      const subscriptionId = extractSubscriptionId(event)
      if (userId) {
        await upgradeUser(userId, subscriptionId || undefined)
      }
      logWebhook("creem", event.eventType as string, "success")
      return NextResponse.json({ success: true })
    }

    logWebhook("creem", rawEventType, "ignored")
    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error("Creem webhook error:", error)
    logWebhook("creem", null, "failed:error")
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}