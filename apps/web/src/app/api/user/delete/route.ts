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

  const { email } = await req.json()
  if (!email) {
    return NextResponse.json({ error: "请提供邮箱地址以确认" }, { status: 400 })
  }

  // 验证邮箱匹配当前用户
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })
  if (!user?.email || user.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "邮箱不匹配，请确认输入的邮箱与账号绑定的邮箱一致" }, { status: 400 })
  }

  // Cascade delete: all related records deleted via Prisma onDelete: Cascade
  await prisma.user.delete({ where: { id: session.user.id } })

  return NextResponse.json({ success: true, message: "账号已永久删除" })
}