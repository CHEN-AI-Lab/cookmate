import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPagePay, generateOrderId, isAlipayConfigured } from "@/lib/alipay-pay"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  if (!isAlipayConfigured()) {
    return NextResponse.json({ error: "支付宝支付正在配置中" }, { status: 503 })
  }

  try {
    const orderId = generateOrderId()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL

    const payUrl = await createPagePay(
      orderId,
      "CookMate Pro 月度订阅",
      15,
      `${baseUrl}/api/alipay/notify`,
      `${baseUrl}/app/billing?success=true`,
    )

    // 保存订单记录
    await prisma.paymentOrder.create({
      data: {
        userId: session.user.id,
        orderId,
        channel: "alipay",
        amount: 1500,
        status: "PENDING",
      },
    })

    return NextResponse.json({ orderId, payUrl })
  } catch (error: any) {
    console.error("Alipay create error:", error)
    return NextResponse.json({ error: error?.message || "创建支付失败" }, { status: 500 })
  }
}