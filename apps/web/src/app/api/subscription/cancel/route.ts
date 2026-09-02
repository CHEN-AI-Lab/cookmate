import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"
import { cancelSubscription } from "@cookmate/shared/api/creem"

// 取消审计日志：记录每次取消尝试（成功 completed / 失败 failed）。
// 目的：上游取消 API 偶发失败时，fail-closed 会保留本地订阅ID（便于 webhook 到期降级 + 可重试），
// 但我们不能「静默」失败 —— 必须留痕，方便对账脚本/后台第一时间发现并去 Creem 后台补刀。
// 注意：WebhookLog 模型无 userId / subscriptionId 列，用户与渠道上下文以 JSON 存入 rawBody。
// 写入失败 console.error 报警（Vercel Logs 自动聚合），不再完全静默
async function logCancelAudit(
  channel: "creem",
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
  } catch (err) {
    console.error("[cancel-audit-write-failed]", { channel, userId, subscriptionId, status, error: err instanceof Error ? err.message : String(err) })
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
    select: { subscriptionTier: true, creemSubscriptionId: true },
  })

  if (user?.subscriptionTier === "FREE") {
    return NextResponse.json({ error: "当前已是免费版，无需取消" }, { status: 400 })
  }

  // 防「PRO + 无任何渠道订阅ID」误返 200：
  // 支付宝一次性付款 / webhook 失败遗留 / 两个渠道都错过回调等场景下，用户会「以为取消但实际没取消」；
  // 这种情况下没有上游订阅可调，无需任何操作 + PRO 会在到期后自动失效。
  if (!user?.creemSubscriptionId) {
    return NextResponse.json({
      error: "当前无活跃订阅渠道（可能是一次性付款或历史遗留状态），PRO 将在到期后自动失效，无需取消",
    }, { status: 409 })
  }

  const data: { creemSubscriptionId?: null } = {}
  const results: { creem?: "completed" | "failed" } = {}

  // 取消 Creem 订阅（立即取消，避免下个周期续费扣款）
  if (user?.creemSubscriptionId) {
    try {
      await cancelSubscription(user.creemSubscriptionId)
      data.creemSubscriptionId = null
      results.creem = "completed"
      await logCancelAudit("creem", session.user.id, user.creemSubscriptionId, "completed")
    } catch (err) {
      console.error("Creem cancel error:", err)
      // fail-closed：本地订阅ID 保留，写失败审计日志便于对账
      results.creem = "failed"
      await logCancelAudit("creem", session.user.id, user.creemSubscriptionId, "failed", err)
    }
  }

  // 清除对应渠道的订阅 ID，保留 PRO 与到期时间（到期前仍可继续使用）
  if (data.creemSubscriptionId !== undefined) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: session.user.id }, data })
    })
  }

  // 取消失败：返 207 Multi-Status 让用户感知到失败
  const anyFailed = results.creem === "failed"
  const status = anyFailed ? 207 : 200
  return NextResponse.json({
    success: !anyFailed,
    partial: anyFailed,
    results,
    message: anyFailed
      ? "部分渠道取消失败，请重试或前往 管理后台 → 取消审计 查看详情"
      : "已取消订阅，当前周期内仍可使用 Pro 功能，到期后将自动降级为免费版",
  }, { status })
}