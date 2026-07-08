import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, phone: true, createdAt: true, subscriptionTier: true, passwordHash: true, subscriptionExpiryDate: true },
      }).catch((err: unknown) => { console.error("findUnique user error:", err); return null })

    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 })

    // 判断登录方式 — 从 session 取当前登录的 provider
    let loginMethod = "其他"
    if (user.email === "demo@cookmate.local") {
      loginMethod = "体验演示"
    } else if (session.user.provider) {
      if (session.user.provider === "password" && session.user.loginMethod === "phone") {
        loginMethod = "手机号+密码"
      } else if (session.user.provider === "password" && session.user.loginMethod === "email") {
        loginMethod = "邮箱+密码"
      } else {
        const providerMap: Record<string, string> = {
          google: "Google", github: "GitHub", alipay: "支付宝",
          "alipay-auth": "支付宝", wechat: "微信",
          email: "邮箱验证码", phone: "手机号验证码",
          password: "邮箱/手机号+密码",
        }
        loginMethod = providerMap[session.user.provider] || session.user.provider
      }
    } else if (user.phone) {
      loginMethod = "手机号"
    } else if (user.email) {
      loginMethod = "邮箱"
    }

    return NextResponse.json({
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      loginMethod,
      createdAt: user.createdAt.toISOString(),
      subscriptionTier: user.subscriptionTier,
      hasPassword: !!user.passwordHash,
      subscriptionExpiryDate: user.subscriptionExpiryDate?.toISOString() || null,
      isDemoUser: isDemoUser(session),
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
    if (isDemoUser(session)) return NextResponse.json({ error: "体验用户不支持修改资料，请注册后使用" }, { status: 403 })

    const { name, phone, email, password } = await req.json()

    // 更新用户名 — 不需要密码验证
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
      })
      return NextResponse.json({ success: true, name })
    }

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

    return NextResponse.json({ error: "没有要更新的内容" }, { status: 400 })
  } catch (error) {
    console.error("Profile PUT:", error)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}