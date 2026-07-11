import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"

function isPhone(val: string) {
  return /^1\d{10}$/.test(val)
}

function isEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

/** 发送邮件，返回 { ok, quotaExceeded } */
async function sendEmailViaResend(to: string, code: string): Promise<{ ok: boolean; quotaExceeded: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, quotaExceeded: false }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CookMate <noreply@aaigc.online>",
        to,
        subject: "CookMate 登录验证码",
        html: `<div style="font-family:sans-serif;padding:24px;max-width:400px">
          <h2 style="color:#FF6B35">🍳 CookMate</h2>
          <p style="color:#333">您的验证码是：</p>
          <div style="font-size:32px;font-weight:bold;color:#FF6B35;letter-spacing:8px;text-align:center;padding:16px;background:#FFF8F0;border-radius:12px;margin:16px 0">
            ${code}
          </div>
          <p style="color:#999;font-size:12px">验证码 5 分钟内有效，请勿泄露给他人。</p>
        </div>`,
      }),
    })
    if (res.ok) return { ok: true, quotaExceeded: false }

    // 检查是否额度用尽
    const body = await res.json().catch(() => ({}))
    const isQuota = body?.name === "daily_quota_exceeded" || body?.name === "monthly_quota_exceeded"
    return { ok: false, quotaExceeded: isQuota }
  } catch (err) {
    console.error("send email error:", err)
    return { ok: false, quotaExceeded: false }
  }
}

export async function POST(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const { phone, email } = await req.json()
    const identifier = phone || email

    if (!identifier) {
      return NextResponse.json({ error: err(loc, "loginRequired") }, { status: 400 })
    }

    if (phone && !isPhone(phone)) {
      return NextResponse.json({ error: err(loc, "invalidPhone") }, { status: 400 })
    }
    if (email && !isEmail(email)) {
      return NextResponse.json({ error: err(loc, "invalidEmail") }, { status: 400 })
    }

    // 检查是否 60 秒内已发过
    const recent = phone
      ? await prisma.verificationCode.findFirst({
          where: { phone, used: false, createdAt: { gte: new Date(Date.now() - 60000) } },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.verificationCode.findFirst({
          where: { email: email!, used: false, createdAt: { gte: new Date(Date.now() - 60000) } },
          orderBy: { createdAt: "desc" },
        })
    if (recent) {
      return NextResponse.json({ error: err(loc, "codeRecentlySent") }, { status: 429 })
    }

    // 生成 6 位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000))

    // 存入数据库
    if (phone) {
      await prisma.verificationCode.create({
        data: {
          phone,
          code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      })
    } else {
      await prisma.verificationCode.create({
        data: {
          email: email!,
          code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      })
    }

    // 环境判断：开发环境直接返验证码，生产环境尝试发邮件
    const isDev = process.env.NODE_ENV === "development"

    if (email && !isDev) {
      const result = await sendEmailViaResend(email, code)
      if (result.quotaExceeded) {
        return NextResponse.json({ error: err(loc, "emailQuotaExceeded") }, { status: 429 })
      }
      if (!result.ok) {
        return NextResponse.json({ error: err(loc, "emailSendFailed") }, { status: 500 })
      }
    }

    if (phone && !isDev) {
      return NextResponse.json({ error: err(loc, "smsNotAvailable") }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send code error:", error)
    return NextResponse.json({ error: err(loc, "sendFailed") }, { status: 500 })
  }
}