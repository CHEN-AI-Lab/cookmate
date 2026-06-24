/**
 * Uni-app 体验演示登录
 * 绕过 NextAuth 前端 signIn，直接在后端完成 demo 登录
 * 返回 session cookie + user profile
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const demoEmail = "demo@cookmate.local"

    // 查找或创建体验用户
    let user = await prisma.user.findUnique({ where: { email: demoEmail } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: demoEmail,
          name: "体验用户",
        },
      })
    }

    // 获取 NextAuth signIn 函数，用于创建 session
    const { signIn } = await import("@/lib/auth")
    const result = await signIn("demo", { redirect: false })

    if (result?.error) {
      console.error("Demo login error:", result.error)
      return NextResponse.json({ error: "登录失败" }, { status: 500 })
    }

    // 返回用户信息
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name || "体验用户",
        email: user.email || demoEmail,
        phone: user.phone || "",
        loginMethod: "体验演示",
        createdAt: user.createdAt.toISOString(),
        subscriptionTier: user.subscriptionTier || "FREE",
      },
    })
  } catch (error) {
    console.error("Uni demo login error:", error)
    return NextResponse.json({ error: "登录失败" }, { status: 500 })
  }
}