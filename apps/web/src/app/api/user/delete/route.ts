import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }
  if (isDemoUser(session)) {
    return NextResponse.json({ error: "体验用户不支持此操作" }, { status: 403 })
  }

  const { email, code } = await req.json()
  if (!email || !code) {
    return NextResponse.json({ error: "请提供邮箱和验证码" }, { status: 400 })
  }

  // 验证邮箱匹配当前用户
  if (!session.user.email || session.user.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "邮箱不匹配" }, { status: 400 })
  }

  // 验证验证码
  const record = await prisma.verificationCode.findFirst({
    where: { email, code, used: false, expiresAt: { gte: new Date() } },
    orderBy: { createdAt: "desc" },
  })
  if (!record) {
    return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 })
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  })

  // Cascade delete user and all related data
  await prisma.user.delete({ where: { id: session.user.id } })

  return NextResponse.json({ success: true, message: "账号已永久删除" })
}