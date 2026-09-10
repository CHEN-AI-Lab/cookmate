import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"
import { err, getLocaleFromCookie } from "@cookmate/shared/utils/locale"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  if (isDemoUser(session)) {
    // 体验态：写操作在路由自身再拦一道。middleware 的集中拦截依赖 cookie 组合判断，
    // 伪造一个垃圾 session cookie 即可绕过；此处按会话身份判定，绕过不了。
    return NextResponse.json(
      { error: err(getLocaleFromCookie(req), "demoReadOnly"), demoRestricted: true },
      { status: 403 },
    )
  }
  try {
    const { name, category, quantity } = await req.json()

    // 检查是否已存在同名食材
    if (name) {
      const existing = await prisma.pantryItem.findFirst({
        where: { userId: session.user.id, name, id: { not: id } },
      }).catch((err: unknown) => { console.error("findFirst pantry error:", err); return null })
      if (existing) {
        return NextResponse.json({ error: "已存在同名食材" }, { status: 409 })
      }
    }

    // updateMany + count：条目不存在或不属于本人时返回 404。
    // 旧写法 update 抛 P2025 被 catch 吞掉后返回 success + item:null，前端无从感知失败。
    const updated = await prisma.pantryItem.updateMany({
      where: { id, userId: session.user.id },
      data: { name, category, quantity },
    }).catch((err: unknown) => { console.error("update pantry item error:", err); return null })
    if (!updated || updated.count === 0) {
      return NextResponse.json({ error: "食材不存在" }, { status: 404 })
    }
    const item = await prisma.pantryItem.findFirst({ where: { id, userId: session.user.id } })
    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error("Update pantry item error:", error)
    return NextResponse.json({ error: "更新失败" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  if (isDemoUser(session)) {
    // 体验态：写操作在路由自身再拦一道。middleware 的集中拦截依赖 cookie 组合判断，
    // 伪造一个垃圾 session cookie 即可绕过；此处按会话身份判定，绕过不了。
    return NextResponse.json(
      { error: err(getLocaleFromCookie(req), "demoReadOnly"), demoRestricted: true },
      { status: 403 },
    )
  }
  try {
    await prisma.pantryItem.deleteMany({ where: { id, userId: session.user.id } }).catch((err: unknown) => { console.error("delete pantry item error:", err) })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete pantry item error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
