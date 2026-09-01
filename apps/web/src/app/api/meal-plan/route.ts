import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"
import {
  generateWeeklyPlan,
  normalizeIngredients,
  sanitizeWeeklyPlan,
  type RecipeResult,
} from "@cookmate/shared/api/openai"
import { checkUsageLimit, incrementUsage } from "@/lib/auth-helpers"
import { errMsg, getDayMap } from "@cookmate/shared/utils/meal-plan"

/** sanitizeWeeklyPlan 的输出类型 */
type WeekPlan = Record<string, { breakfast: RecipeResult; lunch: RecipeResult; dinner: RecipeResult }>

/**
 * 合成「未落库」的周计划视图，结构与 DB 查询结果一致，保证前端能正常渲染。
 * 用于两处：
 *   ① AI 降级（fallback）—— mock 数据不写入 DB，避免覆盖用户已有的真实计划；
 *   ② 保存 DB 失败——仍然把生成结果返回给用户，不让这次生成白费。
 * 修复背景：以前 fallback 时直接返回 plan: null，前端判定为失败，界面永远是空的。
 */
function buildUnsavedPlan(weekPlan: WeekPlan, dayMap: Record<string, number>, weekStart: Date) {
  const mealTypeKeys = ["breakfast", "lunch", "dinner"] as const
  const slots = Object.entries(weekPlan).flatMap(([dayName, meals]) =>
    mealTypeKeys.map((mealType) => {
      const recipe = meals?.[mealType]
      return {
        id: `${dayName}-${mealType}`,
        dayOfWeek: dayMap[dayName] ?? 0,
        mealType,
        note: (recipe?.description || "").substring(0, 100),
        recipe: recipe
          ? {
              id: `${dayName}-${mealType}-recipe`,
              title: recipe.title,
              description: recipe.description,
              ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join(", ") : "",
              steps: Array.isArray(recipe.steps) ? recipe.steps.join("\n") : "",
              cookingTime: recipe.cookingTime || 0,
              calories: recipe.calories || 0,
              cuisineType: recipe.cuisineType || "",
            }
          : null,
      }
    })
  )
  return { id: "unsaved-plan", weekStart: weekStart.toISOString(), slots }
}

// Vercel 免费版（Hobby）函数默认上限 10s，AI 周计划生成易超时 → 显式放宽到 60s（Hobby 最高值）
export const maxDuration = 60

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

  // 读取语言偏好
  const cookieHeader = req.headers.get("cookie") || ""
  const locale = cookieHeader.match(/NEXT_LOCALE=([^;]+)/)?.[1] || "zh-CN"
  const e = (zh: string, en: string) => errMsg(locale, zh, en)

  try {
    // auth() 必须在 try 内：NextAuth 报错（如 AUTH_SECRET 缺失、DB 抖动）时会抛异常，
    // 放在 try 外的话会由 Next.js 返回 HTML 500，前端 res.json() 直接崩，只能显示"网络错误"。
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: err(loc, "loginRequired") }, { status: 401 })
    const userId = session.user.id
    const body = await req.json().catch(() => ({}))
    const targetDays: number[] = body?.days ?? [0, 1, 2, 3, 4, 5, 6]

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
        // fail-closed：用量检查出错（如 DB 抖动）时拒绝生成，原实现 catch 返回 true 会让免费用户无限调用付费 AI
        const canGenerate = await checkUsageLimit(userId).catch((err: unknown) => { console.error("check usage limit error:", err); return false })
        if (!canGenerate) {
          return NextResponse.json(
            { error: e("今日次数已用完，明天再来吧", "Daily limit reached, come back tomorrow"), detail: "usage_limit_exceeded" },
            { status: 429 },
          )
        }
      }
    }

    // 耗时日志
    const t0 = Date.now()
    const T = (label: string) => console.log(`[TIMING mealplan] ${label}: ${Date.now() - t0}ms`)
    T("start")

    // 生成周计划
    const { plan: rawPlan, fallback, reason } = await generateWeeklyPlan({
      dietType: user?.dietType || undefined,
      cuisinePref: user?.cuisinePref || undefined,
      servingSize: user?.servingSize || 2,
    }, pantryNames, locale, targetDays)

    T("ai_done")
    if (fallback) {
      // 降级原因写日志：线上排查时不用再猜是没配 KEY、AI 报错还是返回了垃圾数据
      console.warn(`[meal-plan] AI 降级，reason=${reason ?? "unknown"}，返回 mock 计划（不落库）`)
    }

    // AI 返回数据兜底消毒：缺失字段填默认值，避免 .join() 崩溃 + 防止"刷新就丢"
    const weekPlan = sanitizeWeeklyPlan(rawPlan)

    // 获取本周一日期
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    monday.setHours(0, 0, 0, 0)

    // 空数据保护：AI 与 mock 都没产出任何一天时，明确报错，
    // 而不是返回 plan: null 让前端自己撞上空指针。
    if (Object.keys(weekPlan).length === 0) {
      console.error("[meal-plan] 生成结果为空（0 天），无法返回周计划")
      return NextResponse.json(
        { error: e("生成结果为空，请重试", "Generation returned no data, please try again"), detail: "empty weekly plan" },
        { status: 500 },
      )
    }

    // 保存到数据库(降级时不保存,返回 weekPlan 直接显示,不覆盖旧数据)
    const dayMap = getDayMap(locale)
    let mealPlan: Record<string, unknown> = buildUnsavedPlan(weekPlan, dayMap, monday)
    let saved = false
    if (!fallback) {
      try {
        // 只删除选中天的旧 slots，保留未选中天的旧计划
      await prisma.mealSlot.deleteMany({
        where: { mealPlan: { userId: userId, weekStart: monday }, dayOfWeek: { in: targetDays } }
      })

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

      // 查找或创建本周 MealPlan
      const existingPlan = await prisma.mealPlan.findFirst({ where: { userId, weekStart: monday } })
      if (existingPlan) {
        // 已有计划，添加新 slots
        if (slotData.length > 0) {
          await prisma.mealSlot.createMany({
            data: slotData.map(({ dayOfWeek, mealType, recipeId, note }) => ({ mealPlanId: existingPlan.id, dayOfWeek, mealType, recipeId, note })),
          })
        }
        const refreshed = await prisma.mealPlan.findUnique({
          where: { id: existingPlan.id },
          include: { slots: { include: { recipe: true } } },
        })
        // findUnique 理论上不应为 null（刚查到过），兜底保留未落库视图，避免前端拿到 null
        if (refreshed) mealPlan = refreshed as unknown as Record<string, unknown>
      } else {
        // 新建计划
        const created = await prisma.mealPlan.create({
          data: { userId, weekStart: monday, slots: { create: slotData.map(({ dayOfWeek, mealType, recipeId, note }) => ({ dayOfWeek, mealType, note, recipeId })) } },
          include: { slots: { include: { recipe: true } } },
        })
        if (created) mealPlan = created as unknown as Record<string, unknown>
      }

        saved = true
        if (!isDev) { await incrementUsage(userId).catch((err: unknown) => { console.error("increment usage error:", err) }) }
      } catch (err) {
        // 保存失败不阻断：已经生成好的菜谱仍要返回给用户，只是不落库（刷新会丢）
        console.error("Failed to save meal plan to DB (returning generated data only):", err)
      }
    }

    return NextResponse.json({
      plan: mealPlan,
      generated: weekPlan,
      fallback,
      // saved=false 表示这份计划没有落库（AI 降级或写库失败），刷新后不会保留，
      // 前端据此提示用户，而不是默默展示一堆假数据。
      saved,
      // 降级原因：no_key（未配置 AI）/ ai_error（调用失败或超时）/ invalid_data（返回结构异常）
      reason: reason ?? null,
    })
  } catch (error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    console.error("Meal plan generation error:", detail)
    return NextResponse.json({
      error: err(loc, "requestFailed"),
      detail,
    }, { status: 500 })
  }
}