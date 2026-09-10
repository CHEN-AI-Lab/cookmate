import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"
import { err, getLocaleFromCookie } from "@cookmate/shared/utils/locale"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id } }).catch((err: unknown) => { console.error("findUnique recipe error:", err); return null })
    if (!recipe) return NextResponse.json({ error: "菜谱不存在" }, { status: 404 })
    if (recipe.userId !== session.user.id) return NextResponse.json({ error: "无权限" }, { status: 403 })

    const updated = await prisma.recipe.update({
      where: { id },
      data: { starred: !recipe.starred },
    }).catch((err: unknown) => { console.error("update recipe error:", err); return null })

    return NextResponse.json({ starred: updated?.starred ?? false })
  } catch (error) {
    console.error("PATCH star error:", error)
    return NextResponse.json({ error: "操作失败" }, { status: 500 })
  }
}