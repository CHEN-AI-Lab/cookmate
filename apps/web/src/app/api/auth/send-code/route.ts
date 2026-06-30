import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function isPhone(val: string) {
  return /^1\d{10}$/.test(val)
}

function isEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

async function sendEmailViaResend(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

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
    return res.ok
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const { phone, email } = await req.json()
    const identifier = phone || email

    if (!identifier) {
      return NextResponse.json({ error: "请输入手机号或邮箱" }, { status: 400 })
    }

    if (phone && !isPhone(phone)) {
      return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 })
    }
    if (email && !isEmail(email)) {
      return NextResponse.json({ error: "请输入正确的邮箱地址" }, { status: 400 })
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
      return NextResponse.json({ error: "验证码已发送，请稍后再试" }, { status: 429 })
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
      // 生产环境发真实邮件
      const sent = await sendEmailViaResend(email, code)
      if (!sent) {
        console.error(`[Resend] Failed to send code to ${email}, returning dev code instead`)
        // Resend 没配好时直接返回验证码，避免用户收不到
        return NextResponse.json({
          success: true,
          devCode: code,
        })
      }
    }

    console.log(`[DEV] 验证码 for ${phone || email}: ${code}`)

    if (isDev) {
      return NextResponse.json({
        success: true,
        devCode: code,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send code error:", error)
    return NextResponse.json({ error: "发送失败" }, { status: 500 })
  }
}