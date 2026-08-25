import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyNotify } from "@cookmate/shared/api/alipay-pay"
import { PRICING } from "@cookmate/shared/constants/pricing"

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
        // 先查订单：金额校验 + 幂等都依赖它
        const order = await prisma.paymentOrder.findUnique({
          where: { orderId: outTradeNo },
        })

        if (!order) {
          console.error("Alipay notify: order not found", { outTradeNo })
          return new NextResponse("failure", { status: 400 })
        }

        // 金额校验（防御性）：防止优惠 / 汇率差异 / 运营调价 / 篡改场景下「实付≠应付」但仍升 PRO
        // order.amount 单位为分（CNY），params.total_amount 单位为元；强制两位小数比较避免浮点误差
        const expectedAmount = (order.amount / 100).toFixed(2)
        const actualAmount = params.total_amount
        if (Number(actualAmount) !== Number(expectedAmount)) {
          console.error("Alipay notify: amount mismatch", { outTradeNo, actualAmount, expectedAmount })
          return new NextResponse("failure", { status: 400 })
        }

        // 幂等：支付宝会重发 notify（网络重试/success 未送达），
        // 只有订单状态真正从 PENDING → PAID 变更成功时才升级用户，重复回调不再延长订阅
        const updated = await prisma.paymentOrder.updateMany({
          where: { orderId: outTradeNo, status: "PENDING" },
          data: { status: "PAID" },
        })

        if (updated.count > 0) {
          // 续费累加：从 max(now, 现有到期日) 起算，避免吞掉用户剩余天数
          const user = await prisma.user.findUnique({ where: { id: order.userId } })
          const now = new Date()
          const base = user?.subscriptionExpiryDate && user.subscriptionExpiryDate > now
            ? user.subscriptionExpiryDate
            : now
          const expiry = new Date(base)
          // 按订单金额匹配计费周期（支付宝仅支持月/年），避免「年付只得 1 月」的缺陷
          const periodMonths: Record<string, number> = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 }
          let months = 1
          for (const [p, cfg] of Object.entries(PRICING.plans)) {
            if (cfg.cny.amount === order.amount) { months = periodMonths[p] ?? 1; break }
          }
          expiry.setUTCMonth(expiry.getUTCMonth() + months)
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

    // 支付宝要求返回 success
    return new NextResponse("success")
  } catch (error) {
    console.error("Alipay notify error:", error)
    return new NextResponse("failure", { status: 500 })
  }
}