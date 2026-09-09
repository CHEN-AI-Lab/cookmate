import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

// 管理员专用：读取「取消订阅」审计日志（WebhookLog 中 source='cancel' 的记录）。
// 鉴权见 requireAdmin（仅 ADMIN_EMAIL 白名单放行；未配置时一律拒绝，fail-closed）。
export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const logs = await prisma.webhookLog.findMany({
    where: { source: "cancel" },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  // 批量查用户邮箱
  const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[]
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } })
    : []
  const userMap = new Map(users.map((u) => [u.id, u]))

  const parsed = logs.map((l) => {
    const user = l.userId ? userMap.get(l.userId) : undefined
    // 兼容：旧记录可能没有独立 userId 字段，从 rawBody 里解析
    let detail: { userId?: string | null; subscriptionId?: string | null; error?: string } = {}
    if (l.rawBody) {
      try { detail = JSON.parse(l.rawBody) } catch { detail = {} }
    }
    const resolvedUserId = l.userId ?? detail.userId ?? null
    const resolvedSubId = l.subscriptionId ?? detail.subscriptionId ?? null
    const resolvedUser = resolvedUserId ? userMap.get(resolvedUserId) : undefined
    return {
      id: l.id,
      createdAt: l.createdAt,
      channel: l.eventType,
      status: l.status,
      userId: resolvedUserId,
      userEmail: resolvedUser?.email ?? null,
      userName: resolvedUser?.name ?? null,
      subscriptionId: resolvedSubId,
      error: detail.error ?? "",
    }
  })

  const failed = parsed.filter((l) => l.status === "failed").length
  const completed = parsed.filter((l) => l.status === "completed").length
  const lastFailedAt = parsed.find((l) => l.status === "failed")?.createdAt ?? null

  return NextResponse.json({
    total: parsed.length,
    failed,
    completed,
    lastFailedAt,
    logs: parsed,
  })
}
