import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sign } from "@cookmate/shared/api/payment"

// PayJS 支付回调
// PayJS POST 到 notify_url，返回格式：{return_code: 1, out_trade_no: "...", payjs_order_id: "...", transaction_id: "...", total_fee: 1500, paid_ok: true, sign: "..."}
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const data: Record<string, string> = {}
    for (const [key, value] of formData.entries()) {
      data[key] = value.toString()
    }

    // 验证回调签名
    const receivedSign = data.sign
    if (!receivedSign) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }
    const { sign: _, ...signParams } = data
    const computedSign = sign(signParams, process.env.PAYJS_KEY || "")
    if (computedSign !== receivedSign) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }

    const payjsOrderId = data.payjs_order_id
    const outTradeNo = data.out_trade_no
    const paidOk = data.paid_ok === "true"

    if (!payjsOrderId || !outTradeNo || !paidOk) {
      return new Response("fail")
    }

    // 找到并更新订单
    const order = await prisma.paymentOrder.findUnique({
      where: { orderId: outTradeNo },
    })

    if (order && order.status === "PENDING") {
      await prisma.paymentOrder.update({
        where: { orderId: outTradeNo },
        data: { status: "PAID", payjsOrderId },
      })

      // 升级用户（30 天订阅）
      const now = new Date()
      await prisma.user.update({
        where: { id: order.userId },
        data: {
          subscriptionTier: "PRO",
          subscriptionExpiryDate: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
        },
      })
    }

    return new Response("success")
  } catch (error) {
    console.error("Payment notify error:", error)
    return new Response("fail")
  }
}