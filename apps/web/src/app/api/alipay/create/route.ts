import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPagePay, isAlipayConfigured } from "@cookmate/shared/api/alipay-pay"
import { generateOrderId } from "@cookmate/shared/utils/order-id"
import { isDemoUser } from "@/lib/auth-helpers"
import { PRICING } from "@cookmate/shared/constants/pricing"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }
  if (isDemoUser(session)) return NextResponse.json({ error: "体验用户不支持付费，请注册后使用" }, { status: 403 })

  if (!isAlipayConfigured()) {
    return NextResponse.json({ error: "支付宝支付正在配置中" }, { status: 503 })
  }

  try {
    let period: "monthly" | "annual" = "monthly"
    try {
      const body = await req.json()
      if (body.period === "annual" || body.period === "monthly") period = body.period
    } catch { /* 默认 monthly */ }

    const orderId = generateOrderId("alipay")
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    const price = PRICING.get(period, "CNY")
    const subject = period === "annual" ? "CookMate Pro 年度订阅" : "CookMate Pro 月度订阅"

    const payUrl = await createPagePay(
      orderId,
      subject,
      price.amount / 100,
      `${baseUrl}/api/alipay/notify`,
      `${baseUrl}/app/billing?success=true`,
    )

    // 保存订单记录
    await prisma.paymentOrder.create({
      data: {
        userId: session.user.id,
        orderId,
        channel: "alipay",
        amount: price.amount,
        period, // 创建时即写入周期，后台订单记录正确显示
        status: "PENDING",
      },
    })

    return NextResponse.json({ orderId, payUrl })
  } catch (error: unknown) {
    console.error("Alipay create error:", error)
    // 对外只返回固定文案，内部错误细节仅服务端日志记录（防信息泄露）
    return NextResponse.json({ error: "创建支付失败" }, { status: 500 })
  }
}