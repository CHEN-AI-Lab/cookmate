import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"
import { sendEmail } from "@cookmate/shared/utils/email"

function isEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

export async function POST(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const { email, purpose } = await req.json()

    if (!email || !isEmail(email)) {
      return NextResponse.json({ error: err(loc, "invalidEmail") }, { status: 400 })
    }

    // 根据 purpose 检查用户状态
    if (purpose === "login") {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        return NextResponse.json({ error: err(loc, "emailNotRegistered") }, { status: 404 })
      }
    } else if (purpose === "register") {
      const user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        return NextResponse.json({ error: err(loc, "emailAlreadyRegistered") }, { status: 409 })
      }
    }
    // purpose 未指定 = 兼容旧行为（不检查）

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

    // 生成 6 位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000))

    // 存入数据库
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    // 开发环境直接返验证码，生产环境发邮件
    const isDev = process.env.NODE_ENV === "development"

    if (!isDev) {
      const result = await sendEmail(email, "CookMate 登录验证码", `<div style="font-family:sans-serif;padding:24px;max-width:400px">
        <h2 style="color:#FF6B35">🍳 CookMate</h2>
        <p style="color:#333">您的验证码是：</p>
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
    console.error("Send code error:", error)
    return NextResponse.json({ error: err(loc, "sendFailed") }, { status: 500 })
  }
}