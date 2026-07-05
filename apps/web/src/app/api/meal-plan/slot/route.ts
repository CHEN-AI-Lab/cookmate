import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

  try {
    const { slotId, title, description, ingredients, steps, cookingTime, calories, cuisineType } = await req.json()
    if (!slotId) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    // 查找 slot 确保属于当前用户
    const slot = await prisma.mealSlot.findFirst({
      where: { id: slotId, mealPlan: { userId: session.user.id } },
      include: { recipe: true },
    }).catch((err: unknown) => { console.error("findFirst slot error:", err); return null })
    if (!slot) return NextResponse.json({ error: "未找到该餐次" }, { status: 404 })

    // 如果 title 为空字符串，表示删除操作
    if (title === "") {
      const recipeId = slot.recipeId
      if (recipeId) {
        // 解除关联
        await prisma.mealSlot.update({
          where: { id: slotId },
          data: { recipeId: null, note: "" },
        }).catch((err: unknown) => { console.error("update slot error:", err) })
        // 清理孤儿 Recipe 记录
        await prisma.recipe.delete({ where: { id: recipeId } }).catch((err: unknown) => { console.error("delete recipe error:", err) })
      }
      return NextResponse.json({ success: true })
    }

    if (slot.recipe) {
      // 更新关联 Recipe
      await prisma.recipe.update({
        where: { id: slot.recipe.id },
        data: { title, ...(description !== undefined && { description }), ingredients, steps, cookingTime, calories, cuisineType },
      }).catch((err: unknown) => { console.error("update recipe error:", err) })
      // 同步更新 MealSlot.note
      await prisma.mealSlot.update({
        where: { id: slotId },
        data: { note: title },
      }).catch((err: unknown) => { console.error("update slot note error:", err) })
    } else {
      // 没有 Recipe 则创建
      const recipe = await prisma.recipe.create({
        data: { userId: session.user.id, title, ingredients: ingredients || "", steps: steps || "", cookingTime, calories, cuisineType, isGenerated: false },
      }).catch((err: unknown) => { console.error("create recipe error:", err); return null })
      if (recipe) {
        await prisma.mealSlot.update({
          where: { id: slotId },
          data: { recipeId: recipe.id },
        }).catch((err: unknown) => { console.error("update slot recipe error:", err) })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update slot error:", error)
    return NextResponse.json({ error: "保存失败" }, { status: 500 })
  }
}