import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 手动升级接口：绕过 webhook，直接升级当前登录用户到 PRO
 * 用于排查 webhook 不工作的问题
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const expiryDate = new Date()
  expiryDate.setUTCMonth(expiryDate.getUTCMonth() + 1)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      subscriptionTier: "PRO",
      subscriptionExpiryDate: expiryDate,
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true, subscriptionExpiryDate: true },
  })

  return NextResponse.json({
    success: true,
    message: "已手动升级到 PRO",
    user: {
      subscriptionTier: user?.subscriptionTier,
      subscriptionExpiryDate: user?.subscriptionExpiryDate?.toISOString(),
    },
  })
}