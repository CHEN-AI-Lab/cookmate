import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 中文星期 → 数字（0=周一…6=周日，与 AI 生成一致）
const dayMap: Record<string, number> = {
  "周一": 0, "周二": 1, "周三": 2, "周四": 3,
  "周五": 4, "周六": 5, "周日": 6,
}

const mealMap: Record<string, string> = {
  "早餐": "breakfast", "午餐": "lunch", "晚餐": "dinner",
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

  try {
    const { title, description, ingredients, steps, cookingTime, calories, cuisineType, dayOfWeek, mealTime, overwrite, starred } = await req.json()
    if (!title || !dayOfWeek || !mealTime) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    const dayNum = dayMap[dayOfWeek]
    const mealType = mealMap[mealTime]
    if (dayNum === undefined || !mealType) {
      return NextResponse.json({ error: "无效的星期或餐次" }, { status: 400 })
    }

    // 获取本周一
    const now = new Date()
    const day = now.getDay()
    const mon = new Date(now)
    mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    mon.setHours(0, 0, 0, 0)

    // 查找或创建本周计划
    let plan = await prisma.mealPlan.findUnique({
      where: { userId_weekStart: { userId: session.user.id, weekStart: mon } },
    })

    if (!plan) {
      plan = await prisma.mealPlan.create({
        data: { userId: session.user.id, weekStart: mon },
      })
    }

    // 检查该时段是否有内容
    const existing = await prisma.mealSlot.findFirst({
      where: { mealPlanId: plan.id, dayOfWeek: dayNum, mealType },
      include: { recipe: true },
    })

    const existingTitle = existing?.recipe?.title || null
    
    // 如果不允许覆盖且该时段存在有效菜谱，返回冲突信息
    if (existing && existingTitle && !overwrite) {
      return NextResponse.json({
        conflict: true,
        existingTitle,
        message: `已有「${existingTitle}」`,
      })
    }

    if (existing) {
      // 更新现有 MealSlot 的 Recipe 标题
      if (existing.recipeId) {
        await prisma.recipe.update({
          where: { id: existing.recipeId },
          data: { title, description: description || "", ingredients: ingredients || "", steps: steps || "", cookingTime, calories, cuisineType, starred: starred || false },
        })
      } else {
        const r = await prisma.recipe.create({
          data: { userId: session.user.id, title, description: description || "", ingredients: ingredients || "", steps: steps || "", cookingTime, calories, cuisineType, isGenerated: false, starred: starred || false },
        })
        await prisma.mealSlot.update({
          where: { id: existing.id },
          data: { recipeId: r.id, note: `${title}${description ? ` - ${description}` : ""}` },
        })
      }
    } else {
      // 先创建 Recipe 记录
      const recipe = await prisma.recipe.create({
        data: {
          userId: session.user.id,
          title,
          description: description || "",
          ingredients: ingredients || "",
          steps: steps || "",
          cookingTime,
          calories,
          cuisineType,
          isGenerated: false,
          starred: starred || false,
        },
      })
      await prisma.mealSlot.create({
        data: {
          mealPlanId: plan.id,
          dayOfWeek: dayNum,
          mealType,
          note: `${title}${description ? ` - ${description}` : ""}`,
          recipeId: recipe.id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Add to meal plan error:", error)
    return NextResponse.json({ error: "添加失败" }, { status: 500 })
  }
}