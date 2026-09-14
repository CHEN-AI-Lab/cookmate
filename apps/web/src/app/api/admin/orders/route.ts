import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"
import { parsePage, parsePageSize, parseListParam, parseDateRange, isAmountMismatch } from "@cookmate/shared/utils/admin-query"

// 管理员专用：订单列表（全部渠道，含月付/年付 period），供后台「订单」Tab 展示。
// 鉴权见 requireAdmin（ADMIN_EMAIL 白名单，fail-closed）。
//
// 分页 + 列筛选（全服务端）：
//   page / pageSize（默认 50、上限 100）
//   createdAtFrom / createdAtTo（ISO 时间戳）
//   email（模糊，跨表查 User.email）/ orderId（模糊）
//   channel / period / status（多选，逗号分隔）
//
// 统计口径：
//   total / paidCount / 各渠道收入 —— 跟随当前筛选（筛选范围内有多少、多少钱）
//   mismatchCount —— **全局**（不受筛选影响），供「订单」tab 角标用（有异常就红着提醒）
export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const { searchParams } = new URL(req.url)
  const page = parsePage(searchParams.get("page"))
  const pageSize = parsePageSize(searchParams.get("pageSize"))

  const email = searchParams.get("email")?.trim()
  const orderId = searchParams.get("orderId")?.trim()
  const channels = parseListParam(searchParams.get("channel"))
  const periods = parseListParam(searchParams.get("period"))
  const statuses = parseListParam(searchParams.get("status"))
  const createdAt = parseDateRange(searchParams.get("createdAtFrom"), searchParams.get("createdAtTo"))

  const where: Prisma.PaymentOrderWhereInput = {
    ...(createdAt ? { createdAt } : {}),
    ...(orderId ? { orderId: { contains: orderId, mode: "insensitive" } } : {}),
    ...(channels.length > 0 ? { channel: { in: channels } } : {}),
    ...(periods.length > 0 ? { period: { in: periods } } : {}),
    ...(statuses.length > 0 ? { status: { in: statuses } } : {}),
    ...(email ? { user: { email: { contains: email, mode: "insensitive" } } } : {}),
  }

  const [total, totalAll, orders, grouped, paidForMismatch] = await Promise.all([
    prisma.paymentOrder.count({ where }),
    // 全局总数（不受筛选影响），供「订单」tab 角标用：无异常时显示它
    prisma.paymentOrder.count(),
    prisma.paymentOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { email: true } } },
    }),
    // 按渠道 × 状态聚合（受筛选影响），一次查询拿到条数与金额
    prisma.paymentOrder.groupBy({
      by: ["channel", "status"],
      where,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    // 全局金额异常数：Prisma 不支持「两列比较」的 where，所以只取 4 个小字段回来自己比。
    // 只挑已支付的行，字段极小；等订单量级上来了再换原生 SQL。
    prisma.paymentOrder.findMany({
      where: { paidAmount: { not: null } },
      select: { amount: true, paidAmount: true, currency: true, paidCurrency: true },
    }),
  ])

  let paidCount = 0
  let creemRevenue = 0
  let alipayRevenue = 0
  for (const g of grouped) {
    if (g.status !== "PAID") continue
    paidCount += g._count._all
    const sum = g._sum.amount ?? 0
    if (g.channel === "creem") creemRevenue += sum
    else if (g.channel === "alipay") alipayRevenue += sum
  }

  const mismatchCount = paidForMismatch.filter(isAmountMismatch).length

  const parsed = orders.map((o) => ({
    id: o.id,
    orderId: o.orderId,
    channel: o.channel, // "creem" | "alipay"
    period: o.period, // "monthly" | "annual" | null（历史订单可能为空）
    amount: o.amount, // 分（creem=美分，alipay=人民币分）
    currency: o.currency, // "USD" | "CNY"，前端据此显示币种符号
    paidAmount: o.paidAmount, // 实付金额（回调写入，未支付/历史订单为 null）
    paidCurrency: o.paidCurrency, // 实付币种
    status: o.status, // PENDING / PAID / EXPIRED
    createdAt: o.createdAt,
    userEmail: o.user?.email ?? null,
  }))

  return NextResponse.json({
    total,
    totalAll,
    page,
    pageSize,
    paidCount,
    creemRevenue,
    alipayRevenue,
    mismatchCount,
    orders: parsed,
  })
}
