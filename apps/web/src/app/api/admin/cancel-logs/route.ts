import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"
import { parsePage, parsePageSize, parseListParam, parseDateRange } from "@cookmate/shared/utils/admin-query"

// 管理员专用：读取「取消订阅」审计日志（WebhookLog 中 source='cancel' 的记录）。
// 鉴权见 requireAdmin（仅 ADMIN_EMAIL 白名单放行；未配置时一律拒绝，fail-closed）。
//
// 分页 + 列筛选：channel（实际存在 eventType 里）、status、subscriptionId（模糊）、
// email（模糊，先解析成 userId）、createdAtFrom / createdAtTo。
// failed / completed 跟随筛选；failedAll / totalAll 是全局值，供 tab 角标用。
export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const { searchParams } = new URL(req.url)
  const page = parsePage(searchParams.get("page"))
  const pageSize = parsePageSize(searchParams.get("pageSize"))

  const subscriptionId = searchParams.get("subscriptionId")?.trim()
  const email = searchParams.get("email")?.trim()
  const createdAt = parseDateRange(searchParams.get("createdAtFrom"), searchParams.get("createdAtTo"))

  const baseWhere: Prisma.WebhookLogWhereInput = { source: "cancel" }
  const where: Prisma.WebhookLogWhereInput = { ...baseWhere }
  if (createdAt) where.createdAt = createdAt
  // 「渠道」列存的其实是 eventType（目前恒为 creem，保留以便后续增加渠道）
  const channels = parseListParam(searchParams.get("channel"))
  if (channels.length > 0) where.eventType = { in: channels }
  const statuses = parseListParam(searchParams.get("status"))
  if (statuses.length > 0) where.status = { in: statuses }
  if (subscriptionId) where.subscriptionId = { contains: subscriptionId, mode: "insensitive" }
  if (email) {
    // WebhookLog 只存 userId，没有到 User 的关系字段 → 先按邮箱查出 userId 集合
    const matched = await prisma.user.findMany({
      where: { email: { contains: email, mode: "insensitive" } },
      select: { id: true },
      take: 500,
    })
    where.userId = { in: matched.map((u) => u.id) }
  }

  const [total, totalAll, logs, failed, failedAll, completed, lastFailedRow] = await Promise.all([
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
    prisma.webhookLog.count({ where: { ...where, status: "completed" } }),
    // 最近一次取消失败的时间（沿用原接口字段，供前台按需展示）
    prisma.webhookLog.findFirst({
      where: { ...where, status: "failed" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ])

  // 批量查用户邮箱
  const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as string[]
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } })
    : []
  const userMap = new Map(users.map((u) => [u.id, u]))

  const parsed = logs.map((l) => {
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

  return NextResponse.json({
    total,
    totalAll,
    page,
    pageSize,
    failed,
    failedAll,
    completed,
    lastFailedAt: lastFailedRow?.createdAt ?? null,
    logs: parsed,
  })
}
