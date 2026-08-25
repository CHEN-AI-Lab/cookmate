import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"
import { cancelSubscription } from "@cookmate/shared/api/creem"
import { cancelStripeSubscription } from "@cookmate/shared/api/stripe"

// 取消审计日志：记录每次取消尝试（成功 completed / 失败 failed）。
// 目的：上游取消 API 偶发失败时，fail-closed 会保留本地订阅ID（便于 webhook 到期降级 + 可重试），
// 但我们不能「静默」失败 —— 必须留痕，方便对账脚本/后台第一时间发现并去 Creem/Stripe 后台补刀。
// 注意：WebhookLog 模型无 userId / subscriptionId 列，用户与渠道上下文以 JSON 存入 rawBody。
async function logCancelAudit(
  channel: "creem" | "stripe",
  userId: string,
  subscriptionId: string | null,
  status: "completed" | "failed",
  error?: unknown,
): Promise<void> {
  try {
    await prisma.webhookLog.create({
      data: {
        source: "cancel",
        eventType: channel,
        status,
        rawBody: JSON.stringify({
          userId,
          subscriptionId,
          error: error instanceof Error ? error.message : String(error ?? ""),
        }),
      },
    })
  } catch {
    // 日志写入失败绝不影响取消主流程
  }
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }
  if (isDemoUser(session)) {
    return NextResponse.json({ error: "体验用户不支持此操作" }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true, creemSubscriptionId: true, stripeSubscriptionId: true },
  })

  if (user?.subscriptionTier === "FREE") {
    return NextResponse.json({ error: "当前已是免费版，无需取消" }, { status: 400 })
  }

  // 防「PRO + 无任何渠道订阅ID」误返 200：
  // 支付宝一次性付款 / webhook 失败遗留 / 两个渠道都错过回调等场景下，用户会「以为取消但实际没取消」；
  // 这种情况下没有上游订阅可调，无需任何操作 + PRO 会在到期后自动失效。
  if (!user?.creemSubscriptionId && !user?.stripeSubscriptionId) {
    return NextResponse.json({
      error: "当前无活跃订阅渠道（可能是一次性付款或历史遗留状态），PRO 将在到期后自动失效，无需取消",
    }, { status: 409 })
  }

  const data: { creemSubscriptionId?: null; stripeSubscriptionId?: null } = {}

  // 取消 Creem 订阅（立即取消，避免下个周期续费扣款）
  if (user?.creemSubscriptionId) {
    try {
      await cancelSubscription(user.creemSubscriptionId)
      data.creemSubscriptionId = null
      await logCancelAudit("creem", session.user.id, user.creemSubscriptionId, "completed")
    } catch (err) {
      console.error("Creem cancel error:", err)
      // fail-closed：本地订阅ID 保留，写失败审计日志便于对账
      await logCancelAudit("creem", session.user.id, user.creemSubscriptionId, "failed", err)
    }
  }

  // 取消 Stripe 订阅（原实现只处理 Creem，Stripe 用户点「取消」实际不取消、仍继续扣费）
  if (user?.stripeSubscriptionId) {
    try {
      await cancelStripeSubscription(user.stripeSubscriptionId)
      data.stripeSubscriptionId = null
      await logCancelAudit("stripe", session.user.id, user.stripeSubscriptionId, "completed")
    } catch (err) {
      console.error("Stripe cancel error:", err)
      // fail-closed：本地订阅ID 保留，写失败审计日志便于对账
      await logCancelAudit("stripe", session.user.id, user.stripeSubscriptionId, "failed", err)
    }
  }

  // 清除对应渠道的订阅 ID，保留 PRO 与到期时间（到期前仍可继续使用）
  if (data.creemSubscriptionId !== undefined || data.stripeSubscriptionId !== undefined) {
    await prisma.user.update({ where: { id: session.user.id }, data })
  }

  return NextResponse.json({
    success: true,
    message: "已取消订阅，当前周期内仍可使用 Pro 功能，到期后将自动降级为免费版",
  })
}