import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    const { email } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "请输入正确的邮箱地址" }, { status: 400 })
    }

    // 检查邮箱是否已被其他账号绑定
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "该邮箱已被其他账号绑定" }, { status: 409 })
    }

    // 生成验证码
    const code = String(Math.floor(100000 + Math.random() * 900000))

    await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    })

    // 发送邮件
    const apiKey = process.env.RESEND_API_KEY
    let sent = false
    if (apiKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "CookMate <noreply@aaigc.online>",
            to: email,
            subject: "CookMate 邮箱绑定验证码",
            html: `<div style="font-family:sans-serif;padding:24px;max-width:400px">
              <h2 style="color:#FF6B35">🍳 CookMate</h2>
              <p style="color:#333">绑定邮箱的验证码是：</p>
              <div style="font-size:32px;font-weight:bold;color:#FF6B35;letter-spacing:8px;text-align:center;padding:16px;background:#FFF8F0;border-radius:12px;margin:16px 0">${code}</div>
              <p style="color:#999;font-size:12px">验证码 5 分钟内有效。</p>
            </div>`,
          }),
        })
        sent = res.ok
      } catch {}
    }

    const isDev = process.env.NODE_ENV === "development"

    if (!isDev && !sent) {
      return NextResponse.json({ error: "邮件发送失败，请检查 RESEND_API_KEY 配置" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      ...(isDev ? { devCode: code } : {}),
    })
  } catch (error) {
    console.error("Bind email send code error:", error)
    return NextResponse.json({ error: "发送失败" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    const { email, code } = await req.json()
    if (!email || !code) return NextResponse.json({ error: "参数不完整" }, { status: 400 })

    // 验证码校验
    const record = await prisma.verificationCode.findFirst({
      where: { email, code, used: false, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    })
    if (!record) return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 })

    // 标记验证码已使用
    await prisma.verificationCode.update({ where: { id: record.id }, data: { used: true } })

    // 检查邮箱是否被其他账号占用
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "该邮箱已被其他账号绑定" }, { status: 409 })
    }

    // 绑定邮箱
    await prisma.user.update({ where: { id: session.user.id }, data: { email } })

    return NextResponse.json({ success: true, email })
  } catch (error) {
    console.error("Bind email error:", error)
    return NextResponse.json({ error: "绑定失败" }, { status: 500 })
  }
}