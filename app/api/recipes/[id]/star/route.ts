import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

  const { id } = await params

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id } }).catch(() => null)
    if (!recipe) return NextResponse.json({ error: "菜谱不存在" }, { status: 404 })
    if (recipe.userId !== session.user.id) return NextResponse.json({ error: "无权限" }, { status: 403 })

    const updated = await prisma.recipe.update({
      where: { id },
      data: { starred: !recipe.starred },
    }).catch(() => null)

    return NextResponse.json({ starred: updated.starred })
  } catch (error) {
    console.error("PATCH star error:", error)
    return NextResponse.json({ error: "操作失败" }, { status: 500 })
  }
}