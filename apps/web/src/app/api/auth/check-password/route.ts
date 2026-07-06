import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { account } = await req.json()
    if (!account) {
      return NextResponse.json({ error: "请输入邮箱或手机号" }, { status: 400 })
    }

    const isPhone = /^1\d{10}$/.test(account)
    const user = isPhone
      ? await prisma.user.findUnique({ where: { phone: account }, select: { passwordHash: true } })
      : await prisma.user.findUnique({ where: { email: account }, select: { passwordHash: true } })

    if (!user) {
      return NextResponse.json({ hasPassword: false, userExists: false })
    }

    return NextResponse.json({ hasPassword: !!user.passwordHash, userExists: true })
  } catch (err) {
    console.error("check password error:", err)
    return NextResponse.json({ error: "查询失败" }, { status: 500 })
  }
}