import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyNotify } from "@cookmate/shared/api/alipay-pay"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const params: Record<string, string> = {}
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString()
    }

    const outTradeNo = params.out_trade_no
    const tradeStatus = params.trade_status
    const appId = params.app_id

    // 验证 app_id
    if (appId !== process.env.AUTH_ALIPAY_ID) {
      return new NextResponse("failure", { status: 400 })
    }

    // 验证签名（fail-closed）：未配置公钥时无法验证回调真实性，
    // 绝不能据此升级用户为 PRO，直接拒绝。原实现在公钥缺失时会跳过验签并照常处理。
    const publicKey = process.env.AUTH_ALIPAY_PUBLIC_KEY
    if (!publicKey) {
      console.error("Alipay notify: AUTH_ALIPAY_PUBLIC_KEY 未配置，拒绝未验签的回调")
      return new NextResponse("failure", { status: 400 })
    }
    if (!verifyNotify(params, publicKey)) {
      console.error("Alipay notify: signature verification failed")
      return new NextResponse("failure", { status: 400 })
    }

    // 只处理支付成功
    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      if (outTradeNo) {
        // 幂等：支付宝会重发 notify（网络重试/success 未送达），
        // 只有订单状态真正从 PENDING → PAID 变更成功时才升级用户，重复回调不再延长订阅
        const updated = await prisma.paymentOrder.updateMany({
          where: { orderId: outTradeNo, status: "PENDING" },
          data: { status: "PAID" },
        })

        if (updated.count > 0) {
          const order = await prisma.paymentOrder.findUnique({
            where: { orderId: outTradeNo },
          })
          if (order) {
            // 续费累加：从 max(now, 现有到期日) 起算，避免吞掉用户剩余天数
            const user = await prisma.user.findUnique({ where: { id: order.userId } })
            const now = new Date()
            const base = user?.subscriptionExpiryDate && user.subscriptionExpiryDate > now
              ? user.subscriptionExpiryDate
              : now
            const expiry = new Date(base)
            expiry.setUTCMonth(expiry.getUTCMonth() + 1)
            await prisma.user.update({
              where: { id: order.userId },
              data: {
                subscriptionTier: "PRO",
                subscriptionExpiryDate: expiry,
              },
            })
          }
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