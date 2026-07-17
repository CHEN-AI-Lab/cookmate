import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createCheckout, retrieveCheckout, isCreemConfigured } from "@cookmate/shared/api/creem"
import { prisma } from "@/lib/prisma"
import { generateOrderId } from "@cookmate/shared/utils/order-id"
import { PRICING } from "@cookmate/shared/constants/pricing"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    if (!isCreemConfigured()) {
      return NextResponse.json({ error: "Creem 支付正在配置中" }, { status: 503 })
    }

    let period: "monthly" | "annual" = "monthly"
    try {
      const body = await req.json()
      if (body.period === "annual" || body.period === "monthly") period = body.period
    } catch { /* 默认 monthly */ }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // 按周期选择对应的 Creem 产品 ID
    const productId = period === "annual"
      ? process.env.CREEM_ANNUAL_PRODUCT_ID
      : process.env.CREEM_MONTHLY_PRODUCT_ID || process.env.CREEM_PRODUCT_ID

    const { checkoutUrl, sessionId } = await createCheckout({
      productId: productId || undefined,
      successUrl: `${baseUrl}/app/billing?success=true`,
      metadata: { userId: session.user.id, period },
    })

    // 保存订单记录（用统一订单号）
    if (sessionId) {
      const orderId = generateOrderId("creem")
      const price = PRICING.get(period, "CNY")
      await prisma.paymentOrder.upsert({
        where: { orderId },
        update: {},
        create: {
          userId: session.user.id,
          orderId,
          channel: "creem",
          amount: price.amount,
          status: "PENDING",
        },
      })
    }

    return NextResponse.json({ url: checkoutUrl, sessionId })
  } catch (error: unknown) {
    console.error("Creem checkout error:", error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || "创建支付失败" },
      { status: 500 }
    )
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

  // 如果没有传 checkoutId，查这个用户最近的 Creem PENDING 订单
  if (!checkoutId) {
    const pending = await prisma.paymentOrder.findFirst({
      where: { userId: session.user.id, channel: "creem", status: "PENDING" },
      orderBy: { createdAt: "desc" },
    })
    if (!pending) {
      return NextResponse.json({ message: "没有待处理的 Creem 订单" })
    }
    return NextResponse.json({ checkoutId: pending.orderId })
  }

  try {
    const checkout = await retrieveCheckout(checkoutId)
    const checkoutMeta = checkout.metadata as Record<string, string> | undefined

    // 安全检查：这个 checkout 必须是当前用户的
    if (checkoutMeta?.userId && checkoutMeta.userId !== session.user.id) {
      return NextResponse.json({ paid: false, error: "订单不属于当前用户" }, { status: 403 })
    }

    const isPaid = checkout.status === "completed"

    if (isPaid) {
      // 更新订单状态
      await prisma.paymentOrder.updateMany({
        where: { orderId: checkoutId },
        data: { status: "PAID" },
      })

      // 升级用户
      const expiryDate = new Date()
      expiryDate.setUTCMonth(expiryDate.getUTCMonth() + 1)
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          subscriptionTier: "PRO",
          subscriptionExpiryDate: expiryDate,
        },
      })

      return NextResponse.json({
        paid: true,
        status: checkout.status,
        message: "支付已确认，已升级到 PRO",
      })
    }

    return NextResponse.json({
      paid: false,
      status: checkout.status,
      message: `支付状态: ${checkout.status}，请完成支付`,
    })
  } catch (error: unknown) {
    return NextResponse.json({
      paid: false,
      error: error instanceof Error ? error.message : String(error),
      message: "查询 Creem 订单失败",
    })
  }
}