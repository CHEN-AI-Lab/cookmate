import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"
import { err, getLocaleFromCookie } from "@cookmate/shared/utils/locale"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }
    if (isDemoUser(session)) {
      // 体验态：写操作在路由自身再拦一道。middleware 的集中拦截依赖 cookie 组合判断，
      // 伪造一个垃圾 session cookie 即可绕过；此处按会话身份判定，绕过不了。
      return NextResponse.json(
        { error: err(getLocaleFromCookie(req), "demoReadOnly"), demoRestricted: true },
        { status: 403 },
      )
    }

    const { orderId } = await params

    // findFirst 一次查完（orderId + userId 同时匹配），userId 不匹配时不返回任何记录
    // ——避免泄露订单存在性（订单号 8 位 hex 实际难枚举，但仍是轻微 IDOR）
    const order = await prisma.paymentOrder.findFirst({
      where: { orderId, userId: session.user.id },
    })
    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }
    if (order.status === "PAID") {
      return NextResponse.json({ error: "已支付的订单不能删除" }, { status: 400 })
    }

    await prisma.paymentOrder.delete({ where: { orderId } })
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Delete order error:", error)
    return NextResponse.json({ error: "删除订单失败，请稍后再试" }, { status: 500 })
  }
}