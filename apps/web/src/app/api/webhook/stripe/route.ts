import { NextResponse } from "next/server"
import { getStripe } from "@cookmate/shared/api/stripe"
import { prisma } from "@/lib/prisma"

// ── Webhook 幂等与审计（与 Creem webhook 一致）──
async function isAlreadyProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.webhookLog.findFirst({
    where: { eventId, status: "processed" },
    select: { id: true },
  })
  return !!existing
}

async function logWebhook(
  source: string,
  eventType: string | null,
  status: string,
  eventId?: string,
): Promise<void> {
  try {
    await prisma.webhookLog.create({
      data: { source, eventType, status, eventId },
    })
  } catch {
    // 日志不影响主流程
  }
}

// ── 业务函数 ──
// 授予 PRO 并写入到期日（来自 Stripe 官方 current_period_end）
async function grantStripeAccess(
  userId: string,
  subscriptionId: string | null,
  customerId: string | null,
  periodEndDate: Date,
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return false

  // 幂等：已是 PRO 且到期日 >= 本次周期结束日，跳过（避免重复续期吞掉剩余天数）
  if (
    user.subscriptionTier === "PRO" &&
    user.subscriptionExpiryDate &&
    user.subscriptionExpiryDate >= periodEndDate
  ) {
    return false
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: "PRO",
      subscriptionExpiryDate: periodEndDate,
      ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      ...(customerId ? { stripeCustomerId: customerId } : {}),
    },
  })
  return true
}

// 撤销 PRO（降级 FREE，清空到期日）；clearSubscriptionId=false 时保留订阅ID以便重试恢复
async function revokeStripeAccess(
  userId: string,
  clearSubscriptionId: boolean = true,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: "FREE",
      subscriptionExpiryDate: null,
      ...(clearSubscriptionId ? { stripeSubscriptionId: null } : {}),
    },
  }).catch(() => {
    // 用户可能已删除，忽略
  })
}

/** Stripe 的 current_period_end 是 unix 秒，转成 Date；无效则返回 null */
function toPeriodEndDate(value: unknown): Date | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null
  const d = new Date(value * 1000)
  return isNaN(d.getTime()) ? null : d
}

/** 从 Stripe 事件对象解析 userId（优先 metadata，否则用 stripeCustomerId 反查） */
async function resolveStripeUserId(
  subscription: Record<string, unknown>,
): Promise<string | null> {
  const meta = subscription.metadata as Record<string, unknown> | undefined
  const metaUserId = typeof meta?.userId === "string" ? meta.userId : null
  if (metaUserId) return metaUserId

  const customerId = subscription.customer as string | undefined
  if (customerId) {
    const u = await prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    })
    return u?.id ?? null
  }
  return null
}

export async function POST(req: Request) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  try {
    const rawBody = await req.text()
    const signature = req.headers.get("stripe-signature") || ""

    let event
    if (!STRIPE_WEBHOOK_SECRET) {
      // 开发环境未配 secret — 直接解析（仅 NODE_ENV!==production 时允许）
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
      }
      event = JSON.parse(rawBody)
    } else {
      // 生产环境：验证签名
      event = getStripe().webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
    }

    const eventId = (event.id as string) || null
    const eventType = (event.type as string) || null

    // 幂等：已处理过的事件直接返回 200（Stripe 会重试，必须幂等）
    if (eventId && (await isAlreadyProcessed(eventId))) {
      await logWebhook("stripe", eventType, "duplicate", eventId)
      return NextResponse.json({ received: true })
    }

    switch (event.type) {
      // 结账完成：记录订单 + 同步 Stripe 客户/订阅 ID，不在此升级
      // 升级交给 customer.subscription.created / .updated（携带 current_period_end）
      case "checkout.session.completed": {
        const session = event.data.object
        const userId = session.metadata?.userId as string | undefined
        const subscriptionId = session.subscription as string | undefined
        const customerId = session.customer as string | undefined
        const amount = typeof session.amount_total === "number" ? session.amount_total : 0

        if (userId) {
          const existing = await prisma.paymentOrder.findFirst({
            where: { userId, channel: "stripe", status: "PENDING" },
            orderBy: { createdAt: "desc" },
          })
          if (existing) {
            await prisma.paymentOrder.update({ where: { id: existing.id }, data: { status: "PAID" } })
          } else {
            await prisma.paymentOrder.create({
              data: { userId, orderId: `stripe_${eventId ?? Date.now()}`, channel: "stripe", amount, status: "PAID" },
            })
          }
        }
        if (customerId || subscriptionId) {
          await prisma.user.update({
            where: userId ? { id: userId } : { stripeCustomerId: customerId as string },
            data: {
              ...(customerId ? { stripeCustomerId: customerId } : {}),
              ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
            },
          }).catch(() => {})
        }
        break
      }

      // 订阅创建 / 更新：核心授权点（携带 current_period_end）
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object
        const subscriptionId = subscription.id as string | undefined
        const status = subscription.status as string
        const periodEnd = toPeriodEndDate(subscription.current_period_end)

        const userId = await resolveStripeUserId(subscription)
        if (!userId) {
          await logWebhook("stripe", eventType, "failed:unresolved", eventId ?? undefined)
          return NextResponse.json({ error: "user not resolvable" }, { status: 500 })
        }

        if (status === "active" || status === "trialing") {
          if (!periodEnd) {
            await logWebhook("stripe", eventType, "failed:no-period-end", eventId ?? undefined)
            return NextResponse.json({ error: "missing period end" }, { status: 500 })
          }
          await grantStripeAccess(userId, subscriptionId ?? null, subscription.customer as string | null, periodEnd)
        } else {
          // canceled / past_due / incomplete / unpaid / expired 等 → 降级
          // past_due / incomplete / unpaid 保留订阅ID，便于重试成功后再授权；canceled 清除
          const keep = status === "past_due" || status === "incomplete" || status === "unpaid"
          await revokeStripeAccess(userId, !keep)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const userId = await resolveStripeUserId(subscription)
        if (userId) await revokeStripeAccess(userId, true)
        break
      }

      case "invoice.paid": {
        // 付款成功 — 订阅状态由 subscription.* 事件负责；此处仅记录
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        const email = invoice.customer_email || invoice.customer_name
        console.warn(`Payment failed for ${email || "unknown"}`)
        break
      }

      default: {
        // 未知事件：记录但不处理，返回 200 防止 Stripe 重试
        await logWebhook("stripe", eventType, "ignored", eventId ?? undefined)
        return NextResponse.json({ received: true })
      }
    }

    await logWebhook("stripe", eventType, "processed", eventId ?? undefined)
    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error("Stripe webhook error:", error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || "Webhook processing failed" },
      { status: 400 },
    )
  }
}
