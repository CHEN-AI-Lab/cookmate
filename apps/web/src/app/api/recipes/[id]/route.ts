import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, e } from "@cookmate/shared/utils/locale"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const loc = getLocaleFromCookie(req)
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: e(loc, "请先登录", "Please log in first") }, { status: 401 })

  const { id } = await params

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id } }).catch((err: unknown) => { console.error("findUnique recipe error:", err); return null })
    if (!recipe) return NextResponse.json({ error: e(loc, "菜谱不存在", "Recipe not found") }, { status: 404 })
    if (recipe.userId !== session.user.id) return NextResponse.json({ error: e(loc, "无权限", "No permission") }, { status: 403 })

    await prisma.recipe.delete({ where: { id } }).catch((err: unknown) => { console.error("delete recipe error:", err) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE recipe error:", error)
    return NextResponse.json({ error: e(loc, "删除失败", "Delete failed") }, { status: 500 })
  }
}