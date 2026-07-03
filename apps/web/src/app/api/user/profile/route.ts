import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, phone: true, createdAt: true, subscriptionTier: true, passwordHash: true },
      }).catch(() => null)

    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 })

    // 判断登录方式 — 优先从 Account 表看实际用哪个 OAuth 登录的
    let loginMethod: string
    if (user.email === "demo@cookmate.local") {
      loginMethod = "体验演示"
    } else {
      const accounts = await prisma.account.findMany({
        where: { userId: user.id },
        select: { provider: true },
      })
      // 按优先级判断
      if (accounts.some(a => a.provider === "wechat")) loginMethod = "微信"
      else if (accounts.some(a => a.provider === "alipay")) loginMethod = "支付宝"
      else if (accounts.some(a => a.provider === "google")) loginMethod = "Google"
      else if (accounts.some(a => a.provider === "github")) loginMethod = "GitHub"
      else if (user.phone) loginMethod = "手机号"
      else if (user.email) loginMethod = "邮箱"
      else loginMethod = "其他"
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

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    const { name, phone, email, password } = await req.json()

    // 密码验证：绑定手机号/邮箱必须验证密码
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } })
    if (!currentUser?.passwordHash) {
      return NextResponse.json({ error: "请先设置密码后再绑定" }, { status: 400 })
    }
    if (!password) return NextResponse.json({ error: "请输入密码验证身份" }, { status: 400 })
    const bcrypt = await import("bcryptjs")
    if (!await bcrypt.compare(password, currentUser.passwordHash)) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 })
    }

    // 绑定手机号
    if (phone) {
      if (!/^1\d{10}$/.test(phone)) return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 })
      const existing = await prisma.user.findUnique({ where: { phone } })
      if (existing && existing.id !== session.user.id) return NextResponse.json({ error: "该手机号已被其他账号绑定" }, { status: 409 })
      await prisma.user.update({ where: { id: session.user.id }, data: { phone } })
      return NextResponse.json({ success: true, phone })
    }

    // 绑定邮箱（密码验证在上面已处理）
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "请输入正确的邮箱" }, { status: 400 })
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing && existing.id !== session.user.id) return NextResponse.json({ error: "该邮箱已被其他账号绑定" }, { status: 409 })
      await prisma.user.update({ where: { id: session.user.id }, data: { email } })
      return NextResponse.json({ success: true, email })
    }

    // 更新用户名
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
      })
      return NextResponse.json({ success: true, name })
    }

    return NextResponse.json({ error: "没有要更新的内容" }, { status: 400 })
  } catch (error) {
    console.error("Profile PUT:", error)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}