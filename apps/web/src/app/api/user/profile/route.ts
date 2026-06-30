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

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    const { name, phone, code } = await req.json()

    // 绑定手机号
    if (phone) {
      if (!code) return NextResponse.json({ error: "请输入验证码" }, { status: 400 })
      if (!/^1\d{10}$/.test(phone)) return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 })

      // 验证码校验
      const record = await prisma.verificationCode.findFirst({
        where: { phone, code, used: false, expiresAt: { gte: new Date() } },
        orderBy: { createdAt: "desc" },
      })
      if (!record) return NextResponse.json({ error: "验证码错误或已过期" }, { status: 401 })

      // 标记验证码已使用
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      })

      // 检查手机号是否已被其他账号绑定
      const existing = await prisma.user.findUnique({ where: { phone } })
      if (existing && existing.id !== session.user.id) {
        return NextResponse.json({ error: "该手机号已被其他账号绑定" }, { status: 409 })
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone },
      })

      return NextResponse.json({ success: true, phone })
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