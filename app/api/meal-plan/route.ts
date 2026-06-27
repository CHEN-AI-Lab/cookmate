import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateWeeklyPlan, normalizeIngredients } from "@/lib/openai"
import { checkUsageLimit, incrementUsage } from "@/lib/auth-helpers"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    // 获取本周一到周日
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    // 搜索存在的周计划
    const plans = await prisma.mealPlan.findMany({
      where: { userId: session.user.id, weekStart: { gte: monday, lte: sunday } },
      include: { slots: { include: { recipe: true } } },
      orderBy: { weekStart: "asc" },
    })

    return NextResponse.json({ plans, weekStart: monday.toISOString() })
  } catch (error) {
    console.error("Meal plan GET:", error)
    return NextResponse.json({ error: "请求失败，请稍后重试" }, { status: 500 })
  }
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

  try {
    const userId = session.user.id

    const user = await prisma.user.findUnique({ where: { id: userId } }).catch(() => null)
    const pantryItems = await prisma.pantryItem.findMany({ where: { userId }, select: { name: true } }).catch(() => [])
    const pantryNames = pantryItems.map((i) => i.name)

    // 使用限额检查（仅在开发模式跳过）
    const isDev = process.env.NODE_ENV !== "production"
    if (!isDev) {
      const isMock = !(process.env.AI_API_KEY || process.env.OPENAI_API_KEY)
      if (!isMock) {
        const canGenerate = await checkUsageLimit(userId)
        if (!canGenerate) {
          return NextResponse.json({ error: "今日次数已用完，明天再来吧" }, { status: 429 })
        }
      }
    }

    // 生成周计划
    const weekPlan = await generateWeeklyPlan({
      dietType: user?.dietType || undefined,
      cuisinePref: user?.cuisinePref || undefined,
      servingSize: user?.servingSize || 2,
    }, pantryNames)

    // 获取本周一日期
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    monday.setHours(0, 0, 0, 0)

    // 保存到数据库：先删旧的，再建新的
    await prisma.mealSlot.deleteMany({ where: { mealPlan: { userId: userId, weekStart: monday } } })


    // 清理孤立的旧 Recipe（没有 MealSlot 引用的），排除已收藏的
    try {
      await prisma.recipe.deleteMany({
        where: { mealSlots: { none: {} }, userId, isGenerated: true, starred: false },
      })
    } catch (err) {
      console.error("Cleanup orphan recipes error:", err)
    }

    await prisma.mealPlan.deleteMany({ where: { userId: userId, weekStart: monday } })

    // 先创建每个菜谱（处理重复标题：P2002 时查找已有）
    const slotEntries = Object.entries(weekPlan).flatMap(([dayName, meals], dayIdx) => {
      const dayMap: Record<string, number> = { "周一": 0, "周二": 1, "周三": 2, "周四": 3, "周五": 4, "周六": 5, "周日": 6 }
      const dow = dayMap[dayName] ?? dayIdx
      return Object.entries(meals).map(([mealType, recipe]) => ({ dayOfWeek: dow, mealType, recipe }))
    })

    // 创建菜谱并处理重复
    const slotData: { dayOfWeek: number; mealType: string; recipeId: string; note: string }[] = []
    for (const { dayOfWeek, mealType, recipe } of slotEntries) {
      let recipeId: string
      try {
        const created = await prisma.recipe.create({
          data: {
            userId,
            title: recipe.title,
            description: recipe.description || "",
            ingredients: normalizeIngredients(recipe.ingredients).join(", "),
            steps: recipe.steps.join("\n"),
            cookingTime: recipe.cookingTime || 0,
            calories: recipe.calories || 0,
            cuisineType: recipe.cuisineType || "",
            difficulty: recipe.difficulty || "easy",
            isGenerated: true,
          },
        })
        recipeId = created.id
      } catch (err: any) {
        if (err?.code === "P2002") {
          // 同名菜谱已存在，复用
          const existing = await prisma.recipe.findFirst({ where: { userId, title: recipe.title } })
          if (existing) {
            recipeId = existing.id
          } else {
            throw err
          }
        } else {
          throw err
        }
      }
      slotData.push({ dayOfWeek, mealType, recipeId, note: (recipe.description || "").substring(0, 100) })
    }

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        weekStart: monday,
        slots: {
          create: slotData.map(({ dayOfWeek, mealType, recipeId, note }) => ({
            dayOfWeek,
            mealType,
            note,
            recipeId,
          })),
        },
      },
      include: { slots: { include: { recipe: true } } },
    })

    // 消耗一次使用次数（仅在正式环境计数）
    if (!isDev) {
      await incrementUsage(userId)
    }

    return NextResponse.json({ plan: mealPlan })
  } catch (error) {
    console.error("Meal plan generation error:", error)
    return NextResponse.json({ error: "生成失败，AI 暂时无法响应，请稍后重试" }, { status: 500 })
  }
}