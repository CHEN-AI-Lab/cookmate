import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  try {
    const { name, category, quantity } = await req.json()
    const item = await prisma.pantryItem.update({
      where: { id, userId: session.user.id },
      data: { name, category, quantity },
    })
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
  try {
    await prisma.pantryItem.deleteMany({ where: { id, userId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete pantry item error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
