import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ── 辅助函数：从 webhook 事件中提取各种字段 ──

// 从 metadata 提取 userId（CookMate 创建结账时塞入 metadata.userId）
function extractUserIdFromMetadata(event: Record<string, unknown>): string | null {
  const obj = event.object as Record<string, unknown> | undefined
  if (!obj) return null

  // subscription.* 事件：object 就是订阅对象，metadata 在 object.metadata
  if (obj.metadata && typeof obj.metadata === "object") {
    const meta = obj.metadata as Record<string, unknown>
    if (typeof meta.userId === "string") return meta.userId
  }

  // checkout.completed / refund.created：metadata 也在嵌套的 object.subscription.metadata
  if (obj.subscription && typeof obj.subscription === "object") {
    const sub = obj.subscription as Record<string, unknown>
    if (sub.metadata && typeof sub.metadata === "object") {
      const meta = sub.metadata as Record<string, unknown>
      if (typeof meta.userId === "string") return meta.userId
    }
  }

  // refund.created：metadata 还在 object.checkout.metadata
  if (obj.checkout && typeof obj.checkout === "object") {
    const checkout = obj.checkout as Record<string, unknown>
    if (checkout.metadata && typeof checkout.metadata === "object") {
      const meta = checkout.metadata as Record<string, unknown>
      if (typeof meta.userId === "string") return meta.userId
    }
  }

  return null
}

// 从事件中提取 subscriptionId
function extractSubscriptionId(event: Record<string, unknown>): string | null {
  const obj = event.object as Record<string, unknown> | undefined
  if (!obj) return null

  // subscription.* 事件：object 就是订阅对象
  if (obj.object === "subscription" && typeof obj.id === "string") return obj.id

  // checkout.completed / refund.created：订阅在嵌套的 object.subscription
  if (obj.subscription && typeof obj.subscription === "object") {
    const sub = obj.subscription as Record<string, unknown>
    if (typeof sub.id === "string") return sub.id
  }

  return null
}

// 从事件中提取 current_period_end_date（Creem 官方到期日）
function extractPeriodEndDate(event: Record<string, unknown>): Date | null {
  const obj = event.object as Record<string, unknown> | undefined
  if (!obj) return null

  // subscription.* 事件：直接在 object 上
  if (typeof obj.current_period_end_date === "string") {
    const d = new Date(obj.current_period_end_date)
    if (!isNaN(d.getTime())) return d
  }

  // checkout.completed / refund.created：在嵌套的 object.subscription 上
  if (obj.subscription && typeof obj.subscription === "object") {
    const sub = obj.subscription as Record<string, unknown>
    if (typeof sub.current_period_end_date === "string") {
      const d = new Date(sub.current_period_end_date)
      if (!isNaN(d.getTime())) return d
    }
  }

  return null
}

// 从事件中提取订阅状态
function extractStatus(event: Record<string, unknown>): string | null {
  const obj = event.object as Record<string, unknown> | undefined
  if (!obj) return null
  if (typeof obj.status === "string") return obj.status
  return null
}

// 从事件中提取 orderId（checkout.completed 用）
function extractOrderId(event: Record<string, unknown>): string | null {
  const obj = event.object as Record<string, unknown> | undefined
  if (!obj) return null
  if (typeof obj.id === "string") return obj.id
  if (obj.order && typeof obj.order === "object") {
    const o = obj.order as Record<string, unknown>
    if (typeof o.id === "string") return o.id
  }
  return null
}

// 从事件中提取 period（用于 recordOrder 兜底算金额）
function extractPeriod(event: Record<string, unknown>): string | undefined {
  const obj = event.object as Record<string, unknown> | undefined
  if (!obj) return undefined

  // 优先从 product.billing_period 推导（更可靠）
  const product = obj.product as Record<string, unknown> | undefined
  if (product && typeof product.billing_period === "string") {
    if (product.billing_period === "every-year") return "annual"
    if (product.billing_period === "every-month") return "monthly"
  }

  // 兜底从 metadata.period 取（CookMate 创建结账时塞的）
  if (obj.metadata && typeof obj.metadata === "object") {
    const meta = obj.metadata as Record<string, unknown>
    if (meta.period === "annual" || meta.period === "monthly") return meta.period as string
  }

  // 嵌套 subscription 的 metadata
  if (obj.subscription && typeof obj.subscription === "object") {
    const sub = obj.subscription as Record<string, unknown>
    if (sub.metadata && typeof sub.metadata === "object") {
      const meta = sub.metadata as Record<string, unknown>
      if (meta.period === "annual" || meta.period === "monthly") return meta.period as string
    }
  }

  return undefined
}

// 兜底计算到期日（当事件未携带官方 current_period_end_date 时）
function computeFallbackExpiry(period?: string): Date {
  const now = new Date()
  const expiry = new Date(now)
  if (period === "annual") {
    expiry.setUTCFullYear(expiry.getUTCFullYear() + 1)
  } else {
    expiry.setUTCMonth(expiry.getUTCMonth() + 1)
  }
  return expiry
}

// 通过 creemSubscriptionId 反查 userId（metadata 没带 userId 时的兜底）
async function findUserIdBySubscriptionId(subscriptionId: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { creemSubscriptionId: subscriptionId },
    select: { id: true },
  })
  return user?.id ?? null
}

// 综合获取 userId：先从 metadata 取，取不到用 subscriptionId 反查
async function resolveUserId(event: Record<string, unknown>): Promise<string | null> {
  const metaUserId = extractUserIdFromMetadata(event)
  if (metaUserId) return metaUserId

  const subId = extractSubscriptionId(event)
  if (subId) {
    return findUserIdBySubscriptionId(subId)
  }

  return null
}

// ── 业务函数 ──

// 记录订单（checkout.completed 用：标记 PENDING → PAID）
async function recordOrder(userId: string, orderId: string, period?: string) {
  const existing = await prisma.paymentOrder.findFirst({
    where: { userId, channel: "creem", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  })

  if (existing) {
    await prisma.paymentOrder.update({
      where: { id: existing.id },
      data: { status: "PAID" },
    })
    return
  }

  // 防「一次付款产生两条订单」：本地订单号（CKCRxxx）与 Creem checkoutId（ch_xxx）不同，
  // webhook 比 create-checkout 先到的极端竞态下若回退新建，orderId 会是 ch_xxx（Creem ID），
  // 与本地 PENDING（CKCRxxx）并存 → 用户看到两条订单。
  // 此场景下直接跳过 recordOrder；PRO 升级由 subscription.paid（用 Creem 权威数据）处理。
  console.warn(
    `[creem-webhook] recordOrder: no PENDING order found for userId=${userId} orderId=${orderId}; skip (PRO upgrade handled by subscription.paid)`,
  )
}

// 授予访问权限（subscription.paid 用）
// 用 Creem 官方的 current_period_end_date 作为到期日，不再自己算
// 返回结构化结果：granted=true 表示已写入；granted=false 时 reason 区分原因（user 不存在 → 让 Creem 重试；已 PRO → 幂等跳过）
async function grantAccess(
  userId: string,
  subscriptionId: string,
  periodEndDate: Date,
): Promise<{ granted: boolean; reason?: "user-not-found" | "already-pro" }> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { granted: false, reason: "user-not-found" }

  // 幂等：如果用户已经是 PRO 且到期日 >= 本次周期结束日，说明已授权，跳过
  if (user.subscriptionTier === "PRO" && user.subscriptionExpiryDate && user.subscriptionExpiryDate >= periodEndDate) {
    return { granted: false, reason: "already-pro" }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: "PRO",
      subscriptionExpiryDate: periodEndDate,
      creemSubscriptionId: subscriptionId,
    },
  })
  return { granted: true }
}

// 撤销访问权限（paused / expired / past_due / refund 用）
async function revokeAccess(userId: string, clearSubscriptionId: boolean = true): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: "FREE",
      subscriptionExpiryDate: null,
      ...(clearSubscriptionId ? { creemSubscriptionId: null } : {}),
    },
  }).catch(() => {
    // 用户可能已删除，忽略
  })
}

// 同步订阅信息（subscription.active / update 用）
// 只同步 creemSubscriptionId；有 periodEndDate 时同步到期日和 PRO
async function syncSubscription(userId: string, subscriptionId: string, periodEndDate?: Date | null): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      creemSubscriptionId: subscriptionId,
      ...(periodEndDate ? { subscriptionTier: "PRO", subscriptionExpiryDate: periodEndDate } : {}),
    },
  }).catch(() => {
    // 用户可能已删除，忽略
  })
}

// ── 事件ID去重 ──

// 检查事件是否已处理过（幂等保护）
async function isAlreadyProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.webhookLog.findFirst({
    where: { eventId, status: "processed" },
    select: { id: true },
  })
  return !!existing
}

// 记录 webhook 日志
async function logWebhook(
  source: string,
  eventType: string | null,
  status: string,
  rawBody?: string,
  eventId?: string,
): Promise<void> {
  try {
    await prisma.webhookLog.create({
      data: { source, eventType, status, rawBody, eventId },
    })
  } catch {
    // 日志不要影响主流程
  }
}

// ── Webhook 入口 ──

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("creem-signature") || ""
    const body = await req.text()

    // DoS 防护：raw body 大小硬上限，超大直接拒绝（验签前不写库）
    if (body.length > 64 * 1024) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 })
    }

    // 解析事件
    let event: Record<string, unknown> = {}
    try { event = JSON.parse(body) } catch { /* 格式错误，后面签名验证会拦 */ }

    const rawEventType = (event.eventType as string) || null
    const eventId = (event.id as string) || null

    // 验证签名（验签前不写日志 / 不入任何库，防 DoS；签名失败也不带 rawBody 写库）
    const { verifyWebhook } = await import("@cookmate/shared/api/creem")
    if (!verifyWebhook(body, signature)) {
      await logWebhook("creem", rawEventType, "failed:signature", undefined, eventId ?? undefined)
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // 验签通过后才记录收到日志（仅签名合法的请求可入审计表）
    await logWebhook("creem", rawEventType, "received", body, eventId ?? undefined)

    // 事件ID去重：已处理过的事件直接返回 200（Creem 会重试，必须幂等）
    if (eventId && await isAlreadyProcessed(eventId)) {
      logWebhook("creem", rawEventType, "duplicate", undefined, eventId)
      return NextResponse.json({ success: true, message: "duplicate event" })
    }

    // ── checkout.completed ──
    // 记录订单（PENDING → PAID）+ 同步订阅ID，不升级用户
    // 升级交给 subscription.paid（官方推荐）
    if (event.eventType === "checkout.completed") {
      const userId = await resolveUserId(event)
      const orderId = extractOrderId(event) || ""
      const period = extractPeriod(event)
      const subscriptionId = extractSubscriptionId(event)

      if (userId && orderId) {
        await recordOrder(userId, orderId, period)
      }
      // 同步订阅ID（为后续事件的 userId 反查做准备）
      if (userId && subscriptionId) {
        await syncSubscription(userId, subscriptionId)
      }

      await logWebhook("creem", "checkout.completed", "processed", undefined, eventId ?? undefined)
      return NextResponse.json({ success: true })
    }

    // ── subscription.active ──
    // 官方明确："subscription.active is only for data synchronization"
    // 只同步订阅ID，不升级用户
    if (event.eventType === "subscription.active") {
      const userId = await resolveUserId(event)
      const subscriptionId = extractSubscriptionId(event)

      if (userId && subscriptionId) {
        await syncSubscription(userId, subscriptionId)
      }

      await logWebhook("creem", "subscription.active", "processed", undefined, eventId ?? undefined)
      return NextResponse.json({ success: true })
    }

    // ── subscription.paid ──
    // 官方推荐："use subscription.paid to activate user access"
    // 唯一升级点：用 Creem 官方 current_period_end_date 作为到期日
    if (event.eventType === "subscription.paid") {
      const userId = await resolveUserId(event)
      const subscriptionId = extractSubscriptionId(event)
      const periodEndDate = extractPeriodEndDate(event)

      // 关键：升级是「一次性授权点」，必须真正写入数据库后才算处理成功。
      // 若此刻解析不到用户/订阅（如 subscription.paid 早于 checkout.completed 到达、
      // 订阅ID尚未同步），绝不能标记为 processed —— 否则事件ID去重会让 Creem 重试被丢弃，
      // 用户付款后永久无法升级。这里返回 500，让 Creem 按退避策略重试，
      // 待 checkout.completed 同步订阅ID后即可解析到用户并重试成功。
      if (!userId || !subscriptionId) {
        await logWebhook("creem", "subscription.paid", "failed:unresolved", undefined, eventId ?? undefined)
        return NextResponse.json({ error: "user or subscription not resolvable yet" }, { status: 500 })
      }

      const expiryDate = periodEndDate ?? computeFallbackExpiry(extractPeriod(event))
      const result = await grantAccess(userId, subscriptionId, expiryDate)

      // grantAccess 返回 user-not-found：metadata.userId/subscriptionId 与 DB 不匹配，
      // 可能是恶意构造的回调；返回 500 让 Creem 重试（虽然 Creem 不会真的改 userId，但显式失败便于对账）
      if (result.reason === "user-not-found") {
        await logWebhook("creem", "subscription.paid", "failed:user-not-found", undefined, eventId ?? undefined)
        return NextResponse.json({ error: "user not found for metadata.userId" }, { status: 500 })
      }

      // result.reason === "already-pro"：幂等跳过，不算失败，正常返回
      await logWebhook("creem", "subscription.paid", "processed", undefined, eventId ?? undefined)
      return NextResponse.json({ success: true })
    }

    // ── subscription.canceled ──
    // 清除订阅关联（防止下个周期续费），保留 PRO 到到期日（用户已付费的周期不收回）
    if (event.eventType === "subscription.canceled") {
      const userId = await resolveUserId(event)
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { creemSubscriptionId: null },
        }).catch(() => {})
      }
      await logWebhook("creem", "subscription.canceled", "processed", undefined, eventId ?? undefined)
      return NextResponse.json({ success: true })
    }

    // ── subscription.expired ──
    // 周期结束未续费 → 降级 FREE
    if (event.eventType === "subscription.expired") {
      const userId = await resolveUserId(event)
      if (userId) {
        await revokeAccess(userId)
      }
      await logWebhook("creem", "subscription.expired", "processed", undefined, eventId ?? undefined)
      return NextResponse.json({ success: true })
    }

    // ── subscription.paused ──
    // 官方："revoke access when paused"
    // 降级 FREE 但保留订阅ID（恢复时 subscription.update/paid 会重新授权）
    if (event.eventType === "subscription.paused") {
      const userId = await resolveUserId(event)
      if (userId) {
        await revokeAccess(userId, false)
      }
      await logWebhook("creem", "subscription.paused", "processed", undefined, eventId ?? undefined)
      return NextResponse.json({ success: true })
    }

    // ── subscription.past_due ──
    // 付款失败待重试 → 降级 FREE（fail-closed，更安全）
    // 保留订阅ID（重试成功后 subscription.paid 会重新授权）
    if (event.eventType === "subscription.past_due") {
      const userId = await resolveUserId(event)
      if (userId) {
        await revokeAccess(userId, false)
      }
      await logWebhook("creem", "subscription.past_due", "processed", undefined, eventId ?? undefined)
      return NextResponse.json({ success: true })
    }

    // ── subscription.scheduled_cancel ──
    // 计划到期取消 → 不操作（仍有效，到期后 subscription.expired 会处理降级）
    if (event.eventType === "subscription.scheduled_cancel") {
      await logWebhook("creem", "subscription.scheduled_cancel", "processed", undefined, eventId ?? undefined)
      return NextResponse.json({ success: true })
    }

    // ── subscription.update ──
    // 订阅变更（如月→年）→ 同步到期日
    // 只有状态为 active 时才授权，其他状态只同步订阅ID
    if (event.eventType === "subscription.update") {
      const userId = await resolveUserId(event)
      const subscriptionId = extractSubscriptionId(event)
      const periodEndDate = extractPeriodEndDate(event)
      const status = extractStatus(event)

      if (userId && subscriptionId) {
        if (status === "active" && periodEndDate) {
          // 状态正常且有到期日 → 同步并授权
          await syncSubscription(userId, subscriptionId, periodEndDate)
        } else {
          // 状态非 active（如 paused/canceled）→ 只同步订阅ID
          await syncSubscription(userId, subscriptionId)
        }
      } else if (subscriptionId && status === "active" && periodEndDate) {
        // 升级型更新却暂无法解析用户：返回 500，让 Creem 重试（待 checkout.completed 同步订阅ID）
        await logWebhook("creem", "subscription.update", "failed:unresolved", undefined, eventId ?? undefined)
        return NextResponse.json({ error: "user not resolvable yet" }, { status: 500 })
      }
      await logWebhook("creem", "subscription.update", "processed", undefined, eventId ?? undefined)
      return NextResponse.json({ success: true })
    }

    // ── subscription.trialing ──
    // CookMate 没有试用功能 → 仅记录
    if (event.eventType === "subscription.trialing") {
      await logWebhook("creem", "subscription.trialing", "processed", undefined, eventId ?? undefined)
      return NextResponse.json({ success: true })
    }

    // ── refund.created ──
    // 退款 → 立即降级 FREE
    if (event.eventType === "refund.created") {
      const userId = await resolveUserId(event)
      if (userId) {
        await revokeAccess(userId)
      }
      await logWebhook("creem", "refund.created", "processed", undefined, eventId ?? undefined)
      return NextResponse.json({ success: true })
    }

    // ── 未知事件 ──
    // 记录但不处理，返回 200（防止 Creem 重试）
    await logWebhook("creem", rawEventType, "ignored", undefined, eventId ?? undefined)
    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error("Creem webhook error:", error)
    logWebhook("creem", null, "failed:error")
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
