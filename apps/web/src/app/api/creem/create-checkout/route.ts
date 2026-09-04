import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isDemoUser } from "@/lib/auth-helpers"
import { createCheckout, retrieveCheckout, isCreemConfigured } from "@cookmate/shared/api/creem"
import { prisma } from "@/lib/prisma"
import { generateOrderId } from "@cookmate/shared/utils/order-id"
import { PRICING } from "@cookmate/shared/constants/pricing"
import { addMonths, addYears } from "@cookmate/shared/utils/subscription"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    if (isDemoUser(session)) {
      return NextResponse.json({ error: "体验用户不支持付费，请注册后使用" }, { status: 403 })
    }

    if (!isCreemConfigured()) {
      return NextResponse.json({ error: "Creem 支付正在配置中" }, { status: 503 })
    }

    // 支付取消分支：用户从 Creem 跳回 ?canceled=true 时，把最近 PENDING 订单标记为 CANCELED
    const url = new URL(req.url)
    if (url.searchParams.get("cancel") === "true") {
      await prisma.paymentOrder.updateMany({
        where: { userId: session.user.id, channel: "creem", status: "PENDING" },
        data: { status: "CANCELED" },
      }).catch(() => {})
      return NextResponse.json({ success: true })
    }

    let period: "monthly" | "annual" = "monthly"
    try {
      const body = await req.json()
      if (body.period === "annual" || body.period === "monthly") period = body.period
    } catch { /* 默认 monthly */ }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL

    // 按周期选择对应的 Creem 产品 ID
    const productId = period === "annual"
      ? process.env.CREEM_ANNUAL_PRODUCT_ID
      : process.env.CREEM_MONTHLY_PRODUCT_ID || process.env.CREEM_PRODUCT_ID

    const { checkoutUrl, sessionId } = await createCheckout({
      productId: productId || undefined,
      successUrl: `${baseUrl}/app/billing?success=true`,
      metadata: { userId: session.user.id, period },
    })

    // 保存订单记录（用统一订单号 + 关联 Creem sessionId 用于精确反查）
    if (sessionId) {
      const orderId = generateOrderId("creem")
      const price = PRICING.get(period, "CNY")
      await prisma.paymentOrder.create({
        data: {
          userId: session.user.id,
          orderId,
          externalCheckoutId: sessionId, // Creem 的 ch_xxx，用于 webhook + GET 精确匹配
          channel: "creem",
          amount: price.amount,
          status: "PENDING",
        },
      })
    }

    return NextResponse.json({ url: checkoutUrl, sessionId })
  } catch (error: unknown) {
    console.error("Creem checkout error:", error)
    // 对外只返回固定文案，内部错误细节仅服务端日志记录（防信息泄露）
    return NextResponse.json({ error: "创建支付失败" }, { status: 500 })
  }
}

// GET 接口：查询 Creem 订单支付状态
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const checkoutId = searchParams.get("checkoutId")

  // 如果没有传 checkoutId，查这个用户最近的 Creem PENDING 订单，返回其 externalCheckoutId 给前端轮询
  if (!checkoutId) {
    const pending = await prisma.paymentOrder.findFirst({
      where: { userId: session.user.id, channel: "creem", status: "PENDING" },
      orderBy: { createdAt: "desc" },
    })
    if (!pending) {
      return NextResponse.json({ message: "没有待处理的 Creem 订单" })
    }
    return NextResponse.json({ checkoutId: pending.externalCheckoutId ?? pending.orderId })
  }

  try {
    const checkout = await retrieveCheckout(checkoutId)
    const checkoutMeta = checkout.metadata as Record<string, string> | undefined

    // 安全检查：这个 checkout 必须归属当前用户；metadata 缺 userId 时同样拒绝（不放行）
    if (!checkoutMeta?.userId || checkoutMeta.userId !== session.user.id) {
      return NextResponse.json({ paid: false, error: "订单不属于当前用户" }, { status: 403 })
    }

    const isPaid = checkout.status === "completed"

    if (isPaid) {
      // 标记本地订单 PAID（不管之前是 PENDING 还是已被 webhook 标过 PAID）
      const localOrder = await prisma.paymentOrder.findFirst({
        where: { userId: session.user.id, channel: "creem", externalCheckoutId: checkoutId },
      })
      let upgraded = false
      if (localOrder && localOrder.status === "PENDING") {
        await prisma.paymentOrder.updateMany({
          where: { id: localOrder.id, status: "PENDING" },
          data: { status: "PAID" },
        })
      }

      // 升级兜底：checkout 已完成，且用户还不是 PRO（或 PRO 到期日早于本次应得周期）→ 升级
      // 这是 webhook subscription.paid 失败时的关键兜底路径
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      const now = new Date()
      const period = checkoutMeta.period
      const newExpiry = period === "annual" ? addYears(now, 1) : addMonths(now, 1)
      const needsUpgrade = user
        && (user.subscriptionTier !== "PRO"
          || !user.subscriptionExpiryDate
          || user.subscriptionExpiryDate < newExpiry)

      if (needsUpgrade && user) {
        // 续费累加：从 max(now, 现有到期日) 起算
        const base = user.subscriptionExpiryDate && user.subscriptionExpiryDate > now
          ? user.subscriptionExpiryDate
          : now
        const expiryDate = period === "annual" ? addYears(base, 1) : addMonths(base, 1)
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            subscriptionTier: "PRO",
            subscriptionExpiryDate: expiryDate,
          },
        })
        upgraded = true
      }

      return NextResponse.json({
        paid: true,
        status: checkout.status,
        message: upgraded ? "支付已确认，已升级到 PRO" : "该订单已处理过，无需重复升级",
      })
    }

    return NextResponse.json({
      paid: false,
      status: checkout.status,
      message: `支付状态: ${checkout.status}，请完成支付`,
    })
  } catch (error: unknown) {
    console.error("Creem checkout query error:", error)
    // 对外只返回固定文案，内部错误细节仅服务端日志记录（防信息泄露）
    return NextResponse.json({
      paid: false,
      error: "查询 Creem 订单失败",
    })
  }
}