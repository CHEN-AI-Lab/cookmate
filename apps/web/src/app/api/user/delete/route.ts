import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }
  if (isDemoUser(session)) {
    return NextResponse.json({ error: "体验用户不支持此操作" }, { status: 403 })
  }

  // Cascade delete: all related records deleted via Prisma onDelete: Cascade
  await prisma.user.delete({ where: { id: session.user.id } })

  return NextResponse.json({ success: true, message: "账号已删除" })
}
