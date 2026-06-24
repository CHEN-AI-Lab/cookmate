import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  try {
    const userId = session.user.id
    // 收集所有 Recipe ID 批量删除
    const mealPlans = await prisma.mealPlan.findMany({ where: { userId }, include: { slots: { select: { recipeId: true } } } })
    const recipeIds = mealPlans.flatMap((plan) => plan.slots.map((slot) => slot.recipeId).filter(Boolean))
    if (recipeIds.length > 0) {
      await prisma.recipe.deleteMany({ where: { id: { in: recipeIds as string[] }, userId, isGenerated: true } })
    }
    await prisma.mealPlan.deleteMany({ where: { userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete meal plan error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
