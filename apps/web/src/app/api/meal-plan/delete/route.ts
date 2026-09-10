import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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
    const userId = session.user.id
    // 收集所有 Recipe ID 批量删除
    const mealPlans = await prisma.mealPlan.findMany({ where: { userId }, include: { slots: { select: { recipeId: true } } } }).catch((err: unknown) => { console.error("findMany meal plans error:", err); return [] })
    const recipeIds = mealPlans.flatMap((plan) => plan.slots.map((slot) => slot.recipeId).filter(Boolean))
    if (recipeIds.length > 0) {
      await prisma.recipe.deleteMany({ where: { id: { in: recipeIds as string[] }, userId, isGenerated: true } }).catch((err: unknown) => { console.error("delete recipes error:", err) })
    }
    await prisma.mealPlan.deleteMany({ where: { userId } }).catch((err: unknown) => { console.error("delete meal plans error:", err) })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete meal plan error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
