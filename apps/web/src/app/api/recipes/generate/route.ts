import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateRecipes, normalizeIngredients } from "@cookmate/shared/api/openai"
import { checkUsageLimit, incrementUsage } from "@/lib/auth-helpers"
import {
  BLACKLIST, NON_FOOD, TOXIC, PROTECTED, DRUGS,
  ILLEGAL, FICTIONAL, ADDITIVES, getBlockReason,
} from "@cookmate/shared/constants/ingredients"

/** 根据 locale 返回对应语言的错误消息 */
function errMsg(locale: string, zh: string, en: string): string {
  return locale === "en" ? en : zh
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: errMsg("zh-CN", "请先登录", "Please log in first") }, { status: 401 })
  }

  // 读取语言偏好
  const cookieHeader = req.headers.get("cookie") || ""
  const locale = cookieHeader.match(/NEXT_LOCALE=([^;]+)/)?.[1] || "zh-CN"
  const e = (zh: string, en: string) => errMsg(locale, zh, en)

  try {
    const body = await req.json()
    const { ingredients, pantryContext, saveOnly, title, description, steps, cookingTime, calories, cuisineType, difficulty, starred } = body

    // saveOnly 模式：直接保存菜谱到数据库，不调用 AI
    if (saveOnly) {
      const normalizedName = (title || "").trim().toLowerCase()
      if (!normalizedName) return NextResponse.json({ error: e("请输入菜谱名称", "Please enter a recipe name") }, { status: 400 })
      try {
        const saved = await prisma.recipe.create({
          data: {
            userId: session.user.id,
            title: normalizedName,
            description: description || "",
            ingredients: Array.isArray(ingredients) ? ingredients.join("、") : (ingredients || ""),
            steps: Array.isArray(steps) ? steps.join("\n") : (steps || ""),
            cookingTime: cookingTime ? Number(cookingTime) : null,
            calories: calories ? Number(calories) : null,
            cuisineType: cuisineType || null,
            difficulty: difficulty || null,
            isGenerated: true,
            starred: starred ?? false,
          },
        })
        return NextResponse.json({ recipe: saved })
      } catch (err: unknown) {
        const prismaErr = err as { code?: string; message?: string }
        if (prismaErr.code === "P2002") {
          const existing = await prisma.recipe.findFirst({
            where: { userId: session.user.id, title: normalizedName },
          })
          if (existing) {
            const updated = await prisma.recipe.update({
              where: { id: existing.id },
              data: { starred: starred ?? !existing.starred },
            })
            return NextResponse.json({ recipe: updated })
          }
        }
        throw err
      }
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: e("请至少提供一种食材", "Please provide at least one ingredient") }, { status: 400 })
    }

    if (ingredients.length > 20) {
      return NextResponse.json({ error: e("食材最多 20 种", "Maximum 20 ingredients allowed") }, { status: 400 })
    }

    // 风险管控
    const invalid = ingredients.filter((i: string) =>
      BLACKLIST.some((b) => i.toLowerCase().includes(b.toLowerCase()))
    )

    if (invalid.length > 0) {
      return NextResponse.json({
        error: getBlockReason(invalid, locale),
        invalidIngredients: invalid,
      }, { status: 400 })
    }

    const isDev = process.env.NODE_ENV !== "production"
    const isMock = !(process.env.AI_API_KEY || process.env.OPENAI_API_KEY)
    if (!isMock && !isDev) {
      const canGenerate = await checkUsageLimit(session.user.id)
      if (!canGenerate) {
        return NextResponse.json(
          { error: e("今日免费次数已用完，升级 Pro 可无限使用", "Daily free limit reached. Upgrade to Pro for unlimited access") },
          { status: 403 }
        )
      }
    }

    // 读取用户偏好设置
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dietType: true, cuisinePref: true, servingSize: true },
    }).catch((err: unknown) => { console.error("findUnique user error:", err); return null })

    const recipes = await generateRecipes(ingredients, {
      dietType: user?.dietType || undefined,
      cuisinePref: user?.cuisinePref || undefined,
      servingSize: user?.servingSize || undefined,
    }, pantryContext, locale)

    // 保存生成的菜谱到数据库
    const savedRecipes = []
    for (const recipe of recipes) {
      const normalizedName = recipe.title.trim().toLowerCase()
      try {
        const saved = await prisma.recipe.create({
          data: {
            userId: session.user.id,
            title: normalizedName,
            description: recipe.description || "",
            ingredients: normalizeIngredients(recipe.ingredients).join(", "),
            steps: Array.isArray(recipe.steps) ? recipe.steps.join("\n") : (recipe.steps || ""),
            cookingTime: recipe.cookingTime ? Number(recipe.cookingTime) : null,
            calories: recipe.calories ? Number(recipe.calories) : null,
            cuisineType: recipe.cuisineType || null,
            difficulty: recipe.difficulty || null,
            isGenerated: true,
          },
        })
        savedRecipes.push({ ...recipe, id: saved.id })
      } catch (err: unknown) {
        const prismaErr = err as { code?: string }
        if (prismaErr.code === "P2002") continue
        throw err
      }
    }

    if (!isMock && !isDev) {
      await incrementUsage(session.user.id)
    }

    return NextResponse.json({ recipes: savedRecipes })
  } catch (error) {
    console.error("Recipe generation error:", error)
    return NextResponse.json({ error: e("生成失败，请稍后重试", "Generation failed, please try again later") }, { status: 500 })
  }
}