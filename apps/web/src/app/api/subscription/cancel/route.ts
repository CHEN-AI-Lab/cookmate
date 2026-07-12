import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"
import { cancelSubscription } from "@cookmate/shared/api/creem"

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
    select: { subscriptionTier: true, creemSubscriptionId: true },
  })

  if (user?.subscriptionTier === "FREE") {
    return NextResponse.json({ error: "当前已是免费版，无需取消" }, { status: 400 })
  }

  // 如果有 Creem subscription ID，调用 Creem API 取消订阅
  if (user?.creemSubscriptionId) {
    try {
      await cancelSubscription(user.creemSubscriptionId)
    } catch (err) {
      console.error("Creem cancel error:", err)
      // 不阻塞降级流程，继续在数据库端取消
    }
  }

  // 立即降级为免费版，清除所有订阅相关字段
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      subscriptionTier: "FREE",
      subscriptionExpiryDate: null,
      creemSubscriptionId: null,
    },
  })

  return NextResponse.json({ success: true, message: "已取消订阅，已降级为免费版" })
}