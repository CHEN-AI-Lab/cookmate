import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"
import { CATEGORIES, classifyIngredient, isStaple, decomposeDishName, normalizeIngredientName } from "@cookmate/shared/utils/grocery-categories"
import { parseIngredient, mergeQuantities } from "@cookmate/shared/utils/grocery-parser"


export async function GET(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: err(loc, "loginRequired") }, { status: 401 })

    // 获取天数参数，默认7天
    const url = new URL(req.url)
    const daysParam = url.searchParams.get("days")
    const days = daysParam ? Math.max(1, Math.min(7, parseInt(daysParam) || 7)) : 7

    // 获取本周一~周日
    const now = new Date()
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    // 获取周计划
    const plans = await prisma.mealPlan.findMany({
      where: { userId: session.user.id, weekStart: { gte: monday, lte: sunday } },
      include: { slots: { include: { recipe: true } } },
    }).catch((err: unknown) => { console.error("findMany meal plans error:", err); return [] })

    // 获取食材库
    const pantryItems = await prisma.pantryItem.findMany({
      where: { userId: session.user.id },
    }).catch((err: unknown) => { console.error("findMany pantry items error:", err); return [] })
    const pantryNormalized = pantryItems.map((i) => ({
      original: i.name,
      normalized: normalizeIngredientName(i.name),
    }))

    // 从菜谱中收集食材，解析名称和数量
    // 用归一化名称做 key，汇总所有数量及来源菜谱
    const ingredientMap: Map<string, { quantities: string[]; originalNames: Set<string>; sources: { title: string; quantity: string }[] }> = new Map()

    for (const plan of plans) {
      for (const slot of plan.slots) {
        // 按天数过滤：只取前 days 天
        if (slot.dayOfWeek >= days) continue
        if (slot.recipe?.ingredients) {
          const parts = slot.recipe.ingredients.split(",").map((s) => s.trim()).filter(Boolean)
          for (const part of parts) {
            const { name, quantity } = parseIngredient(part)
            if (!name) continue

            // 菜名→主食材拆解：先把菜名拆成基础食材
            const baseIngredients = decomposeDishName(name)
            for (const baseName of baseIngredients) {
              const normalizedName = normalizeIngredientName(baseName)
              if (!ingredientMap.has(normalizedName)) {
                ingredientMap.set(normalizedName, { quantities: [], originalNames: new Set(), sources: [] })
              }
              const entry = ingredientMap.get(normalizedName)!
              if (quantity) {
                entry.quantities.push(quantity)
                entry.sources.push({ title: slot.recipe.title, quantity })
              }
              entry.originalNames.add(name)
            }
          }
        }
      }
    }

    // 构建最终列表
    const ingredientsWithStatus = Array.from(ingredientMap.entries()).map(([normalizedName, entry]) => {
      // 显示名称：归一化后的干净名称（已经去掉了所有数量和括号后缀）
      const displayName = normalizedName
      // 汇总数量：保留所有原始数量传给 mergeQuantities 合并（同单位相加）
      // deduplicate sources by recipe title (keep first occurrence)
      const seenTitles = new Set<string>()
      const uniqueSources = entry.sources.filter((s) => {
        if (seenTitles.has(s.title)) return false
        seenTitles.add(s.title)
        return true
      })
      return {
        name: displayName,
        quantity: mergeQuantities(entry.quantities),
        // 精确匹配：归一化后完全相等才认为在食材库中
        inPantry: pantryNormalized.some((p) => p.normalized === displayName),
        sources: uniqueSources,
      }
    })
    // ====== 构建分类结果 ======
    const categoryGroups: Record<string, { name: string; quantity: string; inPantry: boolean; sources: { title: string; quantity: string }[] }[]> = {}
    for (const cat of CATEGORIES) { categoryGroups[cat] = [] }
    categoryGroups["其他"] = []
    const stapleIncluded = new Set<string>()
    for (const item of ingredientsWithStatus) {
      const decomposed = decomposeDishName(item.name)
      for (const rawIngredient of decomposed) {
        // 跳过常备品（家里长期备着，不需要每周采购），但记下来
        if (isStaple(rawIngredient)) {
          stapleIncluded.add(rawIngredient)
          continue
        }
        const category = classifyIngredient(rawIngredient)
        const existing = categoryGroups[category].find((i) => i.name === rawIngredient)
        if (existing) {
          // 同类合并：同食材合并数量和来源
          if (item.quantity && !existing.quantity.includes(item.quantity)) {
            existing.quantity = existing.quantity ? `${existing.quantity}、${item.quantity}` : item.quantity
          }
          // 合并来源（去重）
          for (const src of item.sources) {
            if (!existing.sources.some((s) => s.title === src.title)) {
              existing.sources.push(src)
            }
          }
        } else {
          categoryGroups[category].push({
            name: rawIngredient,
            quantity: item.quantity,
            inPantry: item.inPantry,
            sources: item.sources,
          })
        }
      }
    }

    // 移除空分类
    const categories: Record<string, { name: string; quantity: string; inPantry: boolean }[]> = {}
    for (const [key, items] of Object.entries(categoryGroups)) {
      if (items.length > 0) {
        categories[key] = items
      }
    }

    // 查询手动添加的物品（按用户隔离）
    const manualDbItems = await prisma.groceryItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    }).catch((err: unknown) => { console.error("findMany meal plans error:", err); return [] })
    const manualNames = manualDbItems.map((i) => i.name)

    return NextResponse.json({
      categories,
      stapleItems: [...stapleIncluded].sort(),
      total: ingredientsWithStatus.length,
      inPantryCount: ingredientsWithStatus.filter((i) => i.inPantry).length,
      manualItems: manualNames,
    })
  } catch (error) {
    console.error("Grocery list GET:", error)
    return NextResponse.json({ error: err(loc, "requestFailed") }, { status: 500 })
  }
}
