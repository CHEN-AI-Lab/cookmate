import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  try {
    const userId = session.user.id
    // 先删除关联的 Recipe（isGenerated=true 的）
    const mealPlans = await prisma.mealPlan.findMany({ where: { userId }, include: { slots: true } })
    for (const plan of mealPlans) {
      for (const slot of plan.slots) {
        if (slot.recipeId) {
          await prisma.recipe.deleteMany({ where: { id: slot.recipeId, userId, isGenerated: true } })
        }
      }
    }
    await prisma.mealPlan.deleteMany({ where: { userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete meal plan error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}
