import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"
import { sendEmail } from "@cookmate/shared/utils/email"
import bcrypt from "bcryptjs"

function isEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

/** POST: 发送忘记密码验证码（仅限已注册邮箱） */
export async function POST(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const { email } = await req.json()
    if (!email || !isEmail(email)) {
      return NextResponse.json({ error: err(loc, "invalidEmail") }, { status: 400 })
    }

    // 检查用户是否已注册
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: err(loc, "emailNotRegistered") }, { status: 404 })
    }

    // 检查是否 2 分钟内已发过
    const recent = await prisma.verificationCode.findFirst({
      where: { email, used: false, createdAt: { gte: new Date(Date.now() - 120000) } },
      orderBy: { createdAt: "desc" },
    })
    if (recent) {
      const elapsed = Math.floor((Date.now() - recent.createdAt.getTime()) / 1000)
      const remaining = Math.max(1, 120 - elapsed)
      return NextResponse.json({
        error: err(loc, "codeRecentlySent"),
        remainingSeconds: remaining,
        devCode: process.env.NODE_ENV === "development" ? recent.code : undefined,
      }, { status: 429 })
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))

    await prisma.verificationCode.create({
      data: { email, code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    })

    const isDev = process.env.NODE_ENV === "development"
    if (!isDev) {
      const result = await sendEmail(email, "CookMate 密码重置", `<div style="font-family:sans-serif;padding:24px;max-width:400px">
        <h2 style="color:#FF6B35">🍳 CookMate</h2>
        <p style="color:#333">您正在重置密码，验证码是：</p>
        <div style="font-size:32px;font-weight:bold;color:#FF6B35;letter-spacing:8px;text-align:center;padding:16px;background:#FFF8F0;border-radius:12px;margin:16px 0">
          ${code}
        </div>
        <p style="color:#999;font-size:12px">验证码 5 分钟内有效，请勿泄露给他人。</p>
      </div>`)
      if (result.quotaExceeded) {
        return NextResponse.json({ error: err(loc, "emailQuotaExceeded") }, { status: 429 })
      }
      if (!result.ok) {
        return NextResponse.json({ error: err(loc, "emailSendFailed") }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, devCode: isDev ? code : undefined })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: err(loc, "sendFailed") }, { status: 500 })
  }
}

/** PUT: 使用验证码重置密码 */
export async function PUT(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const { email, code, password } = await req.json()
    if (!email || !code || !password) {
      return NextResponse.json({ error: err(loc, "missingFields") }, { status: 400 })
    }

    // 验证验证码
    const record = await prisma.verificationCode.findFirst({
      where: { email, code, used: false, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    })
    if (!record) {
      return NextResponse.json({ error: err(loc, "invalidCode") }, { status: 400 })
    }

    // 标记验证码已使用
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    // 更新密码
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: err(loc, "updateFailed") }, { status: 500 })
  }
}