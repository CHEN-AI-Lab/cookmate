import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPaymentOrder, isPaymentConfigured, generateOrderId } from "@cookmate/shared/api/payment"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  if (!isPaymentConfigured()) {
    return NextResponse.json(
      { error: "支付系统正在配置中，上线后即可使用" },
      { status: 503 }
    )
  }

  try {
    const { channel } = await req.json()
    if (channel !== "wechat" && channel !== "alipay") {
      return NextResponse.json({ error: "无效的支付方式" }, { status: 400 })
    }

    const orderId = generateOrderId()

    const result = await createPaymentOrder(
      channel,
      15, // ¥15
      "CookMate Pro 月度订阅",
      orderId
    )

    // 保存订单记录
    await prisma.paymentOrder.create({
      data: {
        userId: session.user.id,
        orderId,
        channel,
        amount: 1500, // 1500 分 = ¥15
        payjsOrderId: result.payjsOrderId,
        status: "PENDING",
      },
    })

    return NextResponse.json({
      orderId,
      payjsOrderId: result.payjsOrderId,
      codeUrl: result.codeUrl,
      channel,
    })
  } catch (error: unknown) {
    console.error("Payment create error:", error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || "创建支付订单失败" },
      { status: 500 }
    )
  }
}