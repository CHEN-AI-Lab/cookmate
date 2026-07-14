import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"
import { generateWeeklyPlan, normalizeIngredients } from "@cookmate/shared/api/openai"
import { checkUsageLimit, incrementUsage } from "@/lib/auth-helpers"
import type { User } from "@prisma/client"

/** 根据 locale 返回对应语言的错误消息 */
function errMsg(locale: string, zh: string, en: string): string {
  return locale === "en" ? en : zh
}

/** locale 感知的星期名 → 索引映射 */
function getDayMap(locale: string): Record<string, number> {
  return locale === "en"
    ? { "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6 }
    : { "周一": 0, "周二": 1, "周三": 2, "周四": 3, "周五": 4, "周六": 5, "周日": 6 }
}

export async function GET(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: err(loc, "loginRequired") }, { status: 401 })

    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const plans = await prisma.mealPlan.findMany({
      where: { userId: session.user.id, weekStart: { gte: monday, lte: sunday } },
      include: { slots: { include: { recipe: true } } },
      orderBy: { weekStart: "asc" },
    }).catch((err: unknown) => { console.error("findMany meal plans error:", err); return [] })

    return NextResponse.json({ plans, weekStart: monday.toISOString() })
  } catch (error) {
    console.error("Meal plan GET:", error)
    return NextResponse.json({ error: err(loc, "requestFailed") }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const loc = getLocaleFromCookie(req)
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: err(loc, "loginRequired") }, { status: 401 })

  // 读取语言偏好
  const cookieHeader = req.headers.get("cookie") || ""
  const locale = cookieHeader.match(/NEXT_LOCALE=([^;]+)/)?.[1] || "zh-CN"
  const e = (zh: string, en: string) => errMsg(locale, zh, en)

  try {
    const userId = session.user.id

    interface MealPlanUser {
      subscriptionTier: string
      subscriptionExpiryDate: Date | null
      dietType: string | null
      cuisinePref: string | null
      servingSize: number | null
    }
    let user: MealPlanUser | null = null
    let pantryNames: string[] = []
    try {
      user = await prisma.user.findUnique({ where: { id: userId } }) as MealPlanUser | null
      const pantryItems = await prisma.pantryItem.findMany({ where: { userId }, select: { name: true } })
      pantryNames = pantryItems.map((i) => i.name)
    } catch (err) {
      console.error("fetch user/pantry data error:", err)
    }

    const isDev = process.env.NODE_ENV !== "production"
    if (!isDev) {
      const isMock = !(process.env.AI_API_KEY || process.env.OPENAI_API_KEY)
      if (!isMock) {
        const canGenerate = await checkUsageLimit(userId).catch((err: unknown) => { console.error("check usage limit error:", err); return true })
        if (!canGenerate) {
          return NextResponse.json({ error: e("今日次数已用完，明天再来吧", "Daily limit reached, come back tomorrow") }, { status: 429 })
        }
      }
    }

    // 生成周计划
    const weekPlan = await generateWeeklyPlan({
      dietType: user?.dietType || undefined,
      cuisinePref: user?.cuisinePref || undefined,
      servingSize: user?.servingSize || 2,
    }, pantryNames, locale)

    // 获取本周一日期
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    monday.setHours(0, 0, 0, 0)

    // 保存到数据库
    let mealPlan: Record<string, unknown> | null = null
    const dayMap = getDayMap(locale)
    try {
      // Delete old slots and meal plan (keep recipes to avoid losing user data)
      await prisma.mealSlot.deleteMany({ where: { mealPlan: { userId: userId, weekStart: monday } } })
      await prisma.mealPlan.deleteMany({ where: { userId: userId, weekStart: monday } })

      const slotEntries = Object.entries(weekPlan).flatMap(([dayName, meals], dayIdx) => {
        const dow = dayMap[dayName] ?? dayIdx
        return Object.entries(meals).map(([mealType, recipe]) => ({ dayOfWeek: dow, mealType, recipe }))
      })

      const slotData: { dayOfWeek: number; mealType: string; recipeId: string; note: string }[] = []
      for (const { dayOfWeek, mealType, recipe } of slotEntries) {
        let recipeId: string
        try {
          const created = await prisma.recipe.create({
            data: {
              userId, title: recipe.title, description: recipe.description || "",
              ingredients: normalizeIngredients(recipe.ingredients).join(", "),
              steps: recipe.steps.join("\n"), cookingTime: recipe.cookingTime || 0,
              calories: recipe.calories || 0, cuisineType: recipe.cuisineType || "",
              difficulty: recipe.difficulty || "easy", isGenerated: true,
            },
          })
          recipeId = created.id
        } catch (err: unknown) {
          const prismaErr = err as { code?: string }
          if (prismaErr.code === "P2002") {
            const existing = await prisma.recipe.findFirst({ where: { userId, title: recipe.title } })
            if (existing) {
              // Update existing recipe with new AI content (keep starred status)
              await prisma.recipe.update({
                where: { id: existing.id },
                data: {
                  description: recipe.description || existing.description,
                  ingredients: normalizeIngredients(recipe.ingredients).join(", "),
                  steps: recipe.steps.join("\n"),
                  cookingTime: recipe.cookingTime || existing.cookingTime,
                  calories: recipe.calories || existing.calories,
                  cuisineType: recipe.cuisineType || existing.cuisineType,
                  difficulty: recipe.difficulty || existing.difficulty,
                },
              })
              recipeId = existing.id
            } else { throw err }
          } else { throw err }
        }
        slotData.push({ dayOfWeek, mealType, recipeId, note: (recipe.description || "").substring(0, 100) })
      }

      mealPlan = await prisma.mealPlan.create({
        data: { userId, weekStart: monday, slots: { create: slotData.map(({ dayOfWeek, mealType, recipeId, note }) => ({ dayOfWeek, mealType, note, recipeId })) } },
        include: { slots: { include: { recipe: true } } },
      })

      if (!isDev) { await incrementUsage(userId).catch((err: unknown) => { console.error("increment usage error:", err) }) }
    } catch (err) {
      console.error("Failed to save meal plan to DB (returning generated data only):", err)
      const mealTypeKeys = ["breakfast", "lunch", "dinner"] as const
      const slots = Object.entries(weekPlan).flatMap(([dayName, meals]) =>
        mealTypeKeys.map((mealType, idx) => ({
          id: `${dayName}-${mealType}`,
          dayOfWeek: dayMap[dayName] ?? 0,
          mealType,
          note: meals[mealType]?.description?.substring(0, 100) || "",
          recipe: meals[mealType] ? {
            id: `${dayName}-${mealType}-recipe`,
            title: meals[mealType].title,
            description: meals[mealType].description,
            ingredients: Array.isArray(meals[mealType].ingredients) ? meals[mealType].ingredients.join(", ") : "",
            steps: Array.isArray(meals[mealType].steps) ? meals[mealType].steps.join("\n") : "",
            cookingTime: meals[mealType].cookingTime || 0,
            calories: meals[mealType].calories || 0,
            cuisineType: meals[mealType].cuisineType || "",
          } : null,
        }))
      )
      mealPlan = { id: "demo-plan", weekStart: monday.toISOString(), slots }
    }

    return NextResponse.json({ plan: mealPlan, generated: weekPlan })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error("Meal plan generation error:", errMsg, error)
    return NextResponse.json({ error: err(loc, "requestFailed"), detail: errMsg }, { status: 500 })
  }
}