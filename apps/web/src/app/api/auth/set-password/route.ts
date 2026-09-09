import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { setPasswordSchema, translateZodErrors } from "@cookmate/shared/validators"
import { isDemoUser } from "@/lib/auth-helpers"
import { checkOtpRateLimit, recordOtpAttempt } from "@cookmate/shared/utils/otp-rate-limit"

export async function POST(req: Request) {
  const { password, phone, email, code, locale } = await req.json()
  const l = locale || "zh-CN"
  try {
    const session = await auth()

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

    if (!password || !code || (!phone && !email)) {
      return NextResponse.json({ error: l === "en" ? "Missing required parameters" : "缺少必要参数" }, { status: 400 })
    }

    // 防爆破：同一邮箱/手机号失败次数过多则锁定（与 forgot-password 同一限流器）
    const rateKey = `otp:${phone || email}`
    if (!checkOtpRateLimit(rateKey).allowed) {
      return NextResponse.json({ error: l === "en" ? "Too many attempts, please try again in 15 minutes" : "尝试次数过多，请 15 分钟后再试" }, { status: 429 })
    }

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
      recordOtpAttempt(rateKey, false)
      return NextResponse.json({ error: l === "en" ? "Invalid or expired verification code" : "验证码错误或已过期" }, { status: 401 })
    }
    recordOtpAttempt(rateKey, true)

    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    const parsed = setPasswordSchema.safeParse({ password })
    if (!parsed.success) {
      return NextResponse.json({ error: translateZodErrors(parsed.error.errors, l)[0] }, { status: 400 })
    }

    const isPhone = !!phone
    const user = isPhone
      ? await prisma.user.findUnique({ where: { phone } })
      : await prisma.user.findUnique({ where: { email: email! } })

    if (!user) {
      return NextResponse.json({ error: l === "en" ? "User not found" : "用户不存在" }, { status: 404 })
    }

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
    return NextResponse.json({ error: l === "en" ? "Failed to set password" : "设置密码失败" }, { status: 500 })
  }
}