import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { phone, email, code } = await req.json()
    const identifier = phone || email
    if (!identifier || !code) {
      return NextResponse.json({ error: "请输入验证码" }, { status: 400 })
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
      return NextResponse.json({ error: "验证码错误或已过期" }, { status: 401 })
    }

    // 标记为已使用
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Verify code only error:", error)
    return NextResponse.json({ error: "验证失败" }, { status: 500 })
  }
}