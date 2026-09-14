import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"
import { parsePage, parsePageSize, parseListParam, parseDateRange } from "@cookmate/shared/utils/admin-query"

// 管理员专用：Cron 定时任务执行记录（source='cron' 的 WebhookLog）。
// expire-sweep / reconcile-cancellations 每次执行都会写一条，供后台查看是否跑过、降级了几人。
//
// 分页 + 列筛选：task（=eventType，多选）、status（多选）、createdAtFrom / createdAtTo。
// failed 跟随筛选；failedAll / totalAll 是全局值，供 tab 角标用。
export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const { searchParams } = new URL(req.url)
  const page = parsePage(searchParams.get("page"))
  const pageSize = parsePageSize(searchParams.get("pageSize"))

  const createdAt = parseDateRange(searchParams.get("createdAtFrom"), searchParams.get("createdAtTo"))

  const baseWhere: Prisma.WebhookLogWhereInput = { source: "cron" }
  const where: Prisma.WebhookLogWhereInput = { ...baseWhere }
  if (createdAt) where.createdAt = createdAt
  const tasks = parseListParam(searchParams.get("task"))
  if (tasks.length > 0) where.eventType = { in: tasks }
  const statuses = parseListParam(searchParams.get("status"))
  if (statuses.length > 0) where.status = { in: statuses }

  const [total, totalAll, logs, failed, failedAll] = await Promise.all([
    prisma.webhookLog.count({ where }),
    prisma.webhookLog.count({ where: baseWhere }),
    prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.webhookLog.count({ where: { ...where, status: "failed" } }),
    prisma.webhookLog.count({ where: { ...baseWhere, status: "failed" } }),
  ])

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
    total,
    totalAll,
    page,
    pageSize,
    failed,
    failedAll,
    logs: parsed,
  })
}
