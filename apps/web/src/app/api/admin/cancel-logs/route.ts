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

  const parsed = logs.map((l) => {
    let detail: { userId?: string | null; subscriptionId?: string | null; error?: string } = {}
    if (l.rawBody) {
      try {
        detail = JSON.parse(l.rawBody)
      } catch {
        detail = {}
      }
    }
    return {
      id: l.id,
      createdAt: l.createdAt,
      channel: l.eventType, // "creem"
      status: l.status, // "failed" | "completed"
      userId: detail.userId ?? null,
      subscriptionId: detail.subscriptionId ?? null,
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
