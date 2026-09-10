import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isStaple } from "@cookmate/shared/utils/grocery-categories"
import { isDemoUser } from "@/lib/auth-helpers"
import { err, getLocaleFromCookie } from "@cookmate/shared/utils/locale"

export async function POST(req: Request) {
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
    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: "请输入物品名称" }, { status: 400 })
    const normalizedName = name.trim().toLowerCase()
    if (!normalizedName) return NextResponse.json({ error: "请输入物品名称" }, { status: 400 })
    if (isStaple(normalizedName)) return NextResponse.json({ error: "该物品不需要购买" }, { status: 400 })
    const existing = await prisma.groceryItem.findFirst({
      where: { userId: session.user.id, name: normalizedName },
    }).catch((err: unknown) => { console.error("findFirst grocery item error:", err); return null })
    if (existing) return NextResponse.json({ error: "该物品已存在" }, { status: 400 })
    const item = await prisma.groceryItem.create({
      data: { userId: session.user.id, name: normalizedName },
    }).catch((err: unknown) => { console.error("create grocery item error:", err); return null })
    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error("Add grocery item error:", error)
    return NextResponse.json({ error: "添加失败" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
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
    const { name } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: "缺少物品名称" }, { status: 400 })
    await prisma.groceryItem.deleteMany({
      where: { userId: session.user.id, name: name.trim().toLowerCase() },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete grocery item error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
