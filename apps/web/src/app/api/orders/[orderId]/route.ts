import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
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