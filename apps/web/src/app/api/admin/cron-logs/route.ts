import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"

// 管理员专用：Cron 定时任务执行记录（source='cron' 的 WebhookLog）。
// expire-sweep / reconcile-cancellations 每次执行都会写一条，供后台查看是否跑过、降级了几人。
export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const logs = await prisma.webhookLog.findMany({
    where: { source: "cron" },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const parsed = logs.map((l) => {
    let detail: Record<string, unknown> = {}
    if (l.rawBody) {
      try {
        detail = JSON.parse(l.rawBody)
      } catch {
        detail = {}
      }
    }
    return {
      id: l.id,
      eventType: l.eventType, // "expire-sweep" | "reconcile-cancellations"
      status: l.status, // processed / failed
      detail, // { count?, failedCount?, completedCount? } 等
      createdAt: l.createdAt,
    }
  })

  return NextResponse.json({
    total: parsed.length,
    logs: parsed,
  })
}
