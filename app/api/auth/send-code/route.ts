import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function isPhone(val: string) {
  return /^1\d{10}$/.test(val)
}

function isEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
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

    console.log(`[DEV] 验证码 for ${phone || email}: ${code}`)

    return NextResponse.json({
      success: true,
      devCode: process.env.NODE_ENV === "development" ? code : undefined,
    })
  } catch (error) {
    console.error("Send code error:", error)
    return NextResponse.json({ error: "发送失败" }, { status: 500 })
  }
}