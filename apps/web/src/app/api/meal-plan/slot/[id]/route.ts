import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"
import { err, getLocaleFromCookie } from "@cookmate/shared/utils/locale"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const slotId = id

    // 查找 slot 确保属于当前用户
    const slot = await prisma.mealSlot.findFirst({
      where: { id: slotId, mealPlan: { userId: session.user.id } },
      include: { recipe: true },
    }).catch((err: unknown) => { console.error("findFirst slot error:", err); return null })
    if (!slot) return NextResponse.json({ error: "未找到该餐次" }, { status: 404 })

    // 解除关联
    await prisma.mealSlot.update({
      where: { id: slotId },
      data: { recipeId: null, note: "" },
    }).catch((err: unknown) => { console.error("update slot error:", err) })

    // 清理孤儿 Recipe 记录
    if (slot.recipeId) {
      await prisma.recipe.delete({ where: { id: slot.recipeId } }).catch((err: unknown) => { console.error("delete recipe error:", err) })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete slot error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}