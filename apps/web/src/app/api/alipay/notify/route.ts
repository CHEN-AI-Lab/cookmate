import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyNotify } from "@/lib/alipay-pay"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const params: Record<string, string> = {}
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString()
    }

    const outTradeNo = params.out_trade_no
    const tradeNo = params.trade_no
    const tradeStatus = params.trade_status
    const totalAmount = params.total_amount
    const appId = params.app_id

    // 验证 app_id
    if (appId !== process.env.ALIPAY_APP_ID) {
      return new NextResponse("failure", { status: 400 })
    }

    // 验证签名
    const publicKey = process.env.ALIPAY_PUBLIC_KEY || ""
    if (publicKey && !verifyNotify(params, publicKey)) {
      console.error("Alipay notify: signature verification failed")
      return new NextResponse("failure", { status: 400 })
    }

    // 只处理支付成功
    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      if (outTradeNo) {
        // 更新订单状态
        await prisma.paymentOrder.updateMany({
          where: { orderId: outTradeNo, status: "PENDING" },
          data: { status: "PAID" },
        })

        // 查找订单关联的用户
        const order = await prisma.paymentOrder.findUnique({
          where: { orderId: outTradeNo },
        })
        if (order) {
          await prisma.user.update({
            where: { id: order.userId },
            data: { subscriptionTier: "PRO" },
          })
        }
      }
    }

    // 支付宝要求返回 success
    return new NextResponse("success")
  } catch (error) {
    console.error("Alipay notify error:", error)
    return new NextResponse("failure", { status: 500 })
  }
}