import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }
  if (isDemoUser(session)) {
    return NextResponse.json({ error: "体验用户不支持此操作" }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true },
  })

  if (user?.subscriptionTier === "FREE") {
    return NextResponse.json({ error: "当前已是免费版，无需取消" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { subscriptionTier: "FREE" },
  })

  return NextResponse.json({ success: true, message: "已取消订阅，当前周期结束后将降级为免费版" })
}