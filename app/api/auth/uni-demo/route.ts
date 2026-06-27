/**
 * Uni-app 体验演示登录
 * 绕过 NextAuth 前端 signIn，直接在后端完成 demo 登录
 * 返回 session cookie + user profile
 */
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // 获取 NextAuth signIn 函数，用于创建 session
    const { signIn } = await import("@/lib/auth")
    const result = await signIn("demo", { redirect: false })

    if (result?.error) {
      console.error("Demo login error:", result.error)
      return NextResponse.json({ error: "登录失败" }, { status: 500 })
    }

    // 返回用户信息（不依赖数据库查询）
    return NextResponse.json({
      success: true,
      user: {
        id: "demo-user-id",
        name: "体验用户",
        email: "demo@cookmate.local",
        phone: "",
        loginMethod: "体验演示",
        createdAt: new Date().toISOString(),
        subscriptionTier: "FREE",
      },
    })
  } catch (error) {
    console.error("Uni demo login error:", error)
    return NextResponse.json({ error: "登录失败" }, { status: 500 })
  }
}