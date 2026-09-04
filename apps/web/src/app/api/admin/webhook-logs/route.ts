import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

// 管理员专用：支付回调流水（Creem / Alipay 的 WebhookLog），供后台「回调流水」Tab 展示。
// 取消审计（source='cancel'）不在本接口，走 /api/admin/cancel-logs。
// rawBody 完整返回（原始 JSON，供管理员查看回调原文）。
export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const logs = await prisma.webhookLog.findMany({
    where: { source: { in: ["creem", "alipay"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  // 批量查用户邮箱（join User 表）
  const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[]
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } })
    : []
  const userMap = new Map(users.map((u) => [u.id, u]))

  const parsed = logs.map((l) => {
    const user = l.userId ? userMap.get(l.userId) : undefined
    return {
      id: l.id,
      source: l.source,
      eventType: l.eventType,
      status: l.status,
      eventId: l.eventId,
      userId: l.userId,
      userEmail: user?.email ?? null,
      userName: user?.name ?? null,
      subscriptionId: l.subscriptionId,
      orderId: l.orderId,
      createdAt: l.createdAt,
      rawPreview: l.rawBody ?? "",
    }
  })

  const failed = parsed.filter((l) => l.status.startsWith("failed")).length

  return NextResponse.json({
    total: parsed.length,
    failed,
    logs: parsed,
  })
}
