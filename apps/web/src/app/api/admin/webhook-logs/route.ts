import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"
import { parsePage, parsePageSize, parseListParam, parseDateRange } from "@cookmate/shared/utils/admin-query"

// 管理员专用：支付回调流水（Creem / Alipay 的 WebhookLog），供后台「回调流水」Tab 展示。
// 取消审计（source='cancel'）不在本接口，走 /api/admin/cancel-logs。
// rawBody 完整返回（原始 JSON，供管理员查看回调原文）。
//
// 分页 + 列筛选：source / eventType / status（多选）、eventId / subscriptionId（模糊）、
// email（模糊，先把邮箱解析成 userId 再过滤）、createdAtFrom / createdAtTo。
// failed 跟随筛选；failedAll 与 totalAll 是全局值，供 tab 角标用（有失败就红着提醒）。
export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const { searchParams } = new URL(req.url)
  const page = parsePage(searchParams.get("page"))
  const pageSize = parsePageSize(searchParams.get("pageSize"))

  const eventId = searchParams.get("eventId")?.trim()
  const subscriptionId = searchParams.get("subscriptionId")?.trim()
  const email = searchParams.get("email")?.trim()
  const createdAt = parseDateRange(searchParams.get("createdAtFrom"), searchParams.get("createdAtTo"))

  const baseWhere: Prisma.WebhookLogWhereInput = { source: { in: ["creem", "alipay"] } }
  const where: Prisma.WebhookLogWhereInput = { ...baseWhere }
  if (createdAt) where.createdAt = createdAt
  const sources = parseListParam(searchParams.get("source"))
  if (sources.length > 0) where.source = { in: sources }
  const eventTypes = parseListParam(searchParams.get("eventType"))
  if (eventTypes.length > 0) where.eventType = { in: eventTypes }
  const statuses = parseListParam(searchParams.get("status"))
  if (statuses.length > 0) where.status = { in: statuses }
  if (eventId) where.eventId = { contains: eventId }
  if (subscriptionId) where.subscriptionId = { contains: subscriptionId }
  if (email) {
    // WebhookLog 只存 userId，没有到 User 的关系字段 → 先按邮箱查出 userId 集合
    const matched = await prisma.user.findMany({
      where: { email: { contains: email } },
      select: { id: true },
      take: 500,
    })
    where.userId = { in: matched.map((u) => u.id) }
  }

  const [total, totalAll, logs, failed, failedAll] = await Promise.all([
    prisma.webhookLog.count({ where }),
    prisma.webhookLog.count({ where: baseWhere }),
    prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.webhookLog.count({ where: { ...where, status: { startsWith: "failed" } } }),
    prisma.webhookLog.count({ where: { ...baseWhere, status: { startsWith: "failed" } } }),
  ])

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
