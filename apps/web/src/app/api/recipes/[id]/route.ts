import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, e, err } from "@cookmate/shared/utils/locale"
import { isDemoUser } from "@/lib/auth-helpers"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const loc = getLocaleFromCookie(req)
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: e(loc, "请先登录", "Please log in first") }, { status: 401 })
  if (isDemoUser(session)) {
    // 体验态：写操作在路由自身再拦一道。middleware 的集中拦截依赖 cookie 组合判断，
    // 伪造一个垃圾 session cookie 即可绕过；此处按会话身份判定，绕过不了。
    return NextResponse.json(
      { error: err(getLocaleFromCookie(req), "demoReadOnly"), demoRestricted: true },
      { status: 403 },
    )
  }

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