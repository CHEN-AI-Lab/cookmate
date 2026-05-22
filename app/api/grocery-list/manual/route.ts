import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  try {
    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: "请输入物品名称" }, { status: 400 })
    const item = await prisma.groceryItem.create({
      data: { userId: session.user.id, name },
    })
    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error("Add grocery item error:", error)
    return NextResponse.json({ error: "添加失败" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "缺少 ID" }, { status: 400 })
    await prisma.groceryItem.deleteMany({ where: { id, userId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete grocery item error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
