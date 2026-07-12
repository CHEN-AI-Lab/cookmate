import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const { orderId } = await params

  const order = await prisma.paymentOrder.findUnique({ where: { orderId } })
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 })
  }
  if (order.status === "PAID") {
    return NextResponse.json({ error: "已支付的订单不能删除" }, { status: 400 })
  }

  await prisma.paymentOrder.delete({ where: { orderId } })
  return NextResponse.json({ success: true })
}