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

  // 调用 Creem API 取消订阅，防止下个月续费扣款
  if (user?.creemSubscriptionId) {
    try {
      await cancelSubscription(user.creemSubscriptionId)
    } catch (err) {
      console.error("Creem cancel error:", err)
    }
  }

  // 清除 Creem subscription ID（已取消），保留 PRO 和到期时间
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      creemSubscriptionId: null,
    },
  })

  return NextResponse.json({
    success: true,
    message: "已取消订阅，当前周期内仍可使用 Pro 功能，到期后将自动降级为免费版",
  })
}