import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

  const { id } = await params

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id } })
    if (!recipe) return NextResponse.json({ error: "菜谱不存在" }, { status: 404 })
    if (recipe.userId !== session.user.id) return NextResponse.json({ error: "无权限" }, { status: 403 })

    await prisma.recipe.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE recipe error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}