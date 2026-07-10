import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { setPasswordSchema, translateZodErrors } from "@cookmate/shared/validators"
import { isDemoUser } from "@/lib/auth-helpers"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const { password, phone, email, code, locale } = await req.json()
    const l = locale || "zh-CN"

    if (session?.user?.id) {
      if (isDemoUser(session)) return NextResponse.json({ error: "体验用户不支持设置密码，请注册后使用" }, { status: 403 })
      if (!password) {
        return NextResponse.json({ error: l === "en" ? "Please enter a password" : "请输入密码" }, { status: 400 })
      }
      const parsed = setPasswordSchema.safeParse({ password })
      if (!parsed.success) {
        return NextResponse.json({ error: translateZodErrors(parsed.error.errors, l)[0] }, { status: 400 })
      }
      const bcrypt = await import("bcryptjs")
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(parsed.data.password, salt)
      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash },
      })
      return NextResponse.json({ success: true })
    }

    // 未登录用户：需要验证码 + 邮箱/手机号
    if (!password || !code || (!phone && !email)) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // 验证验证码
    const record = phone
      ? await prisma.verificationCode.findFirst({
          where: { phone, code, used: false, expiresAt: { gte: new Date() } },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.verificationCode.findFirst({
          where: { email: email!, code, used: false, expiresAt: { gte: new Date() } },
          orderBy: { createdAt: "desc" },
        })

    if (!record) {
      return NextResponse.json({ error: "验证码错误或已过期" }, { status: 401 })
    }

    // 标记验证码为已使用
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    // 校验密码格式
    const parsed = setPasswordSchema.safeParse({ password })
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    // 查找用户
    const isPhone = !!phone
    const user = isPhone
      ? await prisma.user.findUnique({ where: { phone } })
      : await prisma.user.findUnique({ where: { email: email! } })

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 加密并设置密码
    const bcrypt = await import("bcryptjs")
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(parsed.data.password, salt)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Set password error:", error)
    return NextResponse.json({ error: "设置密码失败" }, { status: 500 })
  }
}