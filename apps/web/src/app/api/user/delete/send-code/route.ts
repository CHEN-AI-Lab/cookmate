import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"
import { sendEmail } from "@cookmate/shared/utils/email"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }
  if (isDemoUser(session)) {
    return NextResponse.json({ error: "体验用户不支持此操作" }, { status: 403 })
  }

  const loc = getLocaleFromCookie(req)
  const email = session.user.email
  if (!email) {
    return NextResponse.json({ error: err(loc, "emailNotFound") }, { status: 400 })
  }

  // 检查是否 60 秒内已发过
  const recent = await prisma.verificationCode.findFirst({
    where: { email, used: false, createdAt: { gte: new Date(Date.now() - 60000) } },
    orderBy: { createdAt: "desc" },
  })
  if (recent) {
    return NextResponse.json({ error: err(loc, "codeRecentlySent") }, { status: 429 })
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))

  await prisma.verificationCode.create({
    data: { email, code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  })

  const isDev = process.env.NODE_ENV === "development"
  if (isDev) {
    return NextResponse.json({ success: true, devCode: code })
  }

  const result = await sendEmail(
    email,
    "CookMate 账号删除确认验证码",
    `<div style="font-family:sans-serif;padding:24px;max-width:400px">
      <h2 style="color:#FF6B35">🍳 CookMate</h2>
      <p style="color:#333">您正在申请删除 CookMate 账号。验证码是：</p>
      <div style="font-size:32px;font-weight:bold;color:red;letter-spacing:8px;text-align:center;padding:16px;background:#FFF0F0;border-radius:12px;margin:16px 0">
        ${code}
      </div>
      <p style="color:#999;font-size:12px">验证码 5 分钟内有效。如非本人操作，请忽略此邮件。</p>
    </div>`
  )
  if (result.quotaExceeded) {
    return NextResponse.json({ error: err(loc, "emailQuotaExceeded") }, { status: 429 })
  }
  if (!result.ok) {
    return NextResponse.json({ error: err(loc, "emailSendFailed") }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
