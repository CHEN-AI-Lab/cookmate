import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, phone: true, createdAt: true, subscriptionTier: true, passwordHash: true },
      }).catch(() => null)

    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 })

    // 判断登录方式
    let loginMethod: string
    if (user.email === "demo@cookmate.local") {
      loginMethod = "体验演示"
    } else if (user.phone) {
      loginMethod = "手机号"
    } else if (user.email) {
      loginMethod = "邮箱"
    } else {
      loginMethod = "其他"
    }

    return NextResponse.json({
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      loginMethod,
      createdAt: user.createdAt.toISOString(),
      subscriptionTier: user.subscriptionTier,
      hasPassword: !!user.passwordHash,
    })
  } catch (error) {
    console.error("Profile GET:", error)
    return NextResponse.json({ error: "请求失败" }, { status: 500 })
  }
}