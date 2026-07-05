import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateRecipes, normalizeIngredients } from "@cookmate/shared/api/openai"
import { checkUsageLimit, incrementUsage } from "@/lib/auth-helpers"

// ====== 食材风险管控清单 ======
// 完整版见 docs/risk-control.md

const NON_FOOD = [
  "石头", "沙子", "泥土", "铁", "铜", "铝", "钢", "钉子", "螺丝", "水泥", "玻璃",
  "塑料", "纸", "布", "橡胶", "胶水", "电池", "绳子", "木头", "油漆", "涂料",
  "胶带", "铁丝", "树叶", "树皮", "树枝", "木棍",
]

const TOXIC = [
  "甲醇", "甲醛", "苯", "丙酮", "洗衣粉", "洗洁精", "漂白水", "洁厕灵",
  "消毒液", "84消毒液", "84", "农药", "杀虫剂", "除草剂", "百草枯", "敌敌畏",
  "毒蘑菇", "毒草", "夹竹桃", "曼陀罗", "断肠草", "乌头",
  "汞", "水银", "铅", "镉", "砷", "工业酒精", "乙醇",
]

const PROTECTED = [
  "大熊猫", "熊猫", "金丝猴", "东北虎", "老虎", "雪豹", "藏羚羊", "扬子鳄",
  "中华鲟", "黑熊", "熊掌", "穿山甲", "天鹅", "猫头鹰", "海龟", "鲸鱼", "鲸",
  "鲨鱼", "鱼翅", "海马", "珊瑚", "红豆杉", "银杏", "野生人参", "珙桐", "雪莲",
  "保护动物", "野生动物", "国家保护",
]

const DRUGS = [
  "海洛因", "冰毒", "大麻", "可卡因", "吗啡", "鸦片", "摇头丸", "K粉",
  "罂粟", "罂粟壳", "麻黄草", "LSD", "神仙水", "开心水",
]

const ILLEGAL = [
  "猫", "狗", "猫肉", "狗肉", "蝙蝠", "果子狸", "活吃", "生吃",
]

const FICTIONAL = [
  "恐龙", "龙肉", "凤凰", "独角兽", "麒麟", "美人鱼", "外星人", "异形", "年兽",
]

const ADDITIVES = [
  "苏丹红", "三聚氰胺", "吊白块", "工业明胶", "硼砂", "福尔马林", "工业盐",
]

// 所有黑名单合并
const BLACKLIST = [...NON_FOOD, ...TOXIC, ...PROTECTED, ...DRUGS, ...ILLEGAL, ...FICTIONAL, ...ADDITIVES]

// 分类提示信息
function getBlockReason(invalid: string[]): string {
  for (const item of invalid) {
    if (FICTIONAL.some((w) => item.includes(w))) return `"${item}" 不是真实存在的食材`
    if (PROTECTED.some((w) => item.includes(w))) return `"${item}" 为国家保护动植物，不可食用`
    if (DRUGS.some((w) => item.includes(w))) return `"${item}" 为违禁品，不可食用`
    if (TOXIC.some((w) => item.includes(w))) return `"${item}" 为有毒有害物质，不可食用`
    if (ILLEGAL.some((w) => item.includes(w))) return `"${item}" 为不可食用食材`
    if (NON_FOOD.some((w) => item.includes(w))) return `"${item}" 不是可食用的食材`
    if (ADDITIVES.some((w) => item.includes(w))) return `"${item}" 为国家禁止使用的食品添加剂`
  }
  return "请输入真实可食用的食材"
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { ingredients, pantryContext, saveOnly, title, description, steps, cookingTime, calories, cuisineType, difficulty, starred } = body

    // saveOnly 模式：直接保存菜谱到数据库，不调用 AI
    if (saveOnly) {
      const normalizedName = (title || "").trim().toLowerCase()
      if (!normalizedName) return NextResponse.json({ error: "请输入菜谱名称" }, { status: 400 })
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
      } catch (err: any) {
        // P2002 = 同名菜谱已存在，切换收藏
        if (err?.code === "P2002") {
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
      return NextResponse.json({ error: "请至少提供一种食材" }, { status: 400 })
    }

    // 风险管控：逐项检查黑名单
    const invalid = ingredients.filter((i: string) =>
      BLACKLIST.some((b) => i.includes(b))
    )

    if (invalid.length > 0) {
      return NextResponse.json({
        error: getBlockReason(invalid),
        invalidIngredients: invalid,
      }, { status: 400 })
    }

    const isDev = process.env.NODE_ENV !== "production"
    const isMock = !(process.env.AI_API_KEY || process.env.OPENAI_API_KEY)
    if (!isMock && !isDev) {
      const canGenerate = await checkUsageLimit(session.user.id)
      if (!canGenerate) {
        return NextResponse.json(
          { error: "今日免费次数已用完，升级 Pro 可无限使用" },
          { status: 403 }
        )
      }
    }

    // 读取用户偏好设置
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dietType: true, cuisinePref: true, servingSize: true },
    }).catch(() => null)

    const recipes = await generateRecipes(ingredients, {
      dietType: user?.dietType || undefined,
      cuisinePref: user?.cuisinePref || undefined,
      servingSize: user?.servingSize || undefined,
    }, pantryContext)

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
      } catch (err: any) {
        // P2002 = unique constraint violation（同名菜谱已存在）
        if (err?.code === "P2002") continue
        throw err
      }
    }

    if (!isMock && !isDev) {
      await incrementUsage(session.user.id)
    }

    return NextResponse.json({ recipes: savedRecipes })
  } catch (error) {
    console.error("Recipe generation error:", error)
    return NextResponse.json({ error: "生成失败，请稍后重试" }, { status: 500 })
  }
}