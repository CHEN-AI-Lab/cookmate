import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CATEGORIES, classifyIngredient, isStaple, decomposeDishName, normalizeIngredientName, STAPLE_EXCLUSIONS } from "@/lib/grocery-categories"

// ====== 中文数字映射 ======
const CHINESE_NUMBERS: Record<string, string> = {
  一: "1", 二: "2", 三: "3", 四: "4", 五: "5",
  六: "6", 七: "7", 八: "8", 九: "9", 十: "10",
  两: "2", 半: "0.5", 零: "0",
}

// ====== 解析食材字符串，提取名称和数量 ======
function parseIngredient(raw: string): { name: string; quantity: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { name: "", quantity: "" }

  // 预清理：去掉末尾括号里的克数/重量（"鲈鱼 1条(300g)" → "鲈鱼 1条"）
  let bare = trimmed.replace(/\s*\([^)]*[\d.][^)]*\)\s*$/, '').trim()

  // 额外处理"中文数字+量词+数字+单位"的情况，如"一块100g"、"两块500g"
  // 把"一块100g"转成"100g"以便后续正则提取
  const comboMatch = bare.match(/^(.+?)\s+([一二三四五六七八九十两半]+)(个|只|片|根|条|块|盒|袋|包|瓶|罐|瓣|颗|粒|段)?\s+([\d.]+)\s*(克|斤|两|kg|g|ml|l)?\s*$/)
  if (comboMatch) {
    const name = normalizeIngredientName(comboMatch[1])
    const unit = comboMatch[5] || 'g'
    const qty = comboMatch[4] + unit
    return { name, quantity: qty }
  }

  // 正则1：数字+单位（"200g"、"2个"、"10ml"）
  const numMatch = bare.match(/^(.+?)\s+([\d.]+)\s*(个|只|片|根|条|块|克|斤|两|盒|袋|包|瓶|罐|kg|g|ml|l|勺|碗|杯|份|瓣|颗|粒|段)?\s*$/)
  if (numMatch) {
    const name = normalizeIngredientName(numMatch[1])
    const unit = numMatch[3] || ""
    return { name, quantity: `${numMatch[2]}${unit}` }
  }

  // 正则1.5：分数+单位（"1/2个"、"1/4勺"）
  const fracMatch = bare.match(/^(.+?)\s+(\d+)\/(\d+)\s*(个|只|片|根|条|块|克|斤|两|盒|袋|包|瓶|罐|kg|g|ml|l|勺|碗|杯|份|瓣|颗|粒|段)?\s*$/)
  if (fracMatch) {
    const name = normalizeIngredientName(fracMatch[1])
    const unit = fracMatch[4] || ""
    return { name, quantity: `${fracMatch[2]}/${fracMatch[3]}${unit}` }
  }

  // 正则2：中文数字+量词/单位（"一块"、"两根"、"半块"、"少许"）
  const cnMatch = bare.match(/^(.+?)\s+([一二三四五六七八九十两半]+|少许|适量|若干|少量)\s*(个|只|片|根|条|块|盒|袋|包|瓶|罐|瓣|颗|粒|段)?\s*$/)
  if (cnMatch) {
    const name = normalizeIngredientName(cnMatch[1])
    let qty = cnMatch[2]
    if (cnMatch[3]) qty += cnMatch[3]
    // 中文数字转阿拉伯数字
    for (const [cn, num] of Object.entries(CHINESE_NUMBERS)) {
      qty = qty.replace(cn, num)
    }
    return { name, quantity: qty }
  }

  // 无数量：用 bare 作为名称（已去掉括号克数）
  return { name: bare, quantity: "" }
}

/** 数量合并：同单位数值相加，含"适量"则只显示适量 */
function mergeQuantities(quantities: string[]): string {
  if (quantities.length === 0) return ""
  // 如果包含"适量""少许"等模糊量词，直接显示"适量"
  if (quantities.some((q) => q === "适量" || q === "少许" || q === "少量")) return "适量"
  if (quantities.length === 1) return roundUpFraction(quantities[0])

  // 解析每个数量
  interface QtyPart { num: number; unit: string; raw: string }
  const parts: QtyPart[] = quantities.map((q) => {
    const m = q.match(/^(\d+(?:\.\d+)?)\s*([^\d\s]*)$/)
    if (m) return { num: parseFloat(m[1]), unit: m[2], raw: q }
    const fm = q.match(/^(\d+)\/(\d+)\s*([^\d\s]*)$/)
    if (fm) return { num: parseInt(fm[1]) / parseInt(fm[2]), unit: fm[3], raw: q }
    return { num: 0, unit: "", raw: q }
  })

  // 按单位分组求和
  const byUnit = new Map<string, number>()
  const unparsed: string[] = []
  for (const p of parts) {
    if (p.num > 0 && p.unit) {
      byUnit.set(p.unit, (byUnit.get(p.unit) || 0) + p.num)
    } else {
      unparsed.push(p.raw)
    }
  }

  // 拼装结果
  const merged: string[] = []
  for (const [unit, total] of byUnit) {
    merged.push(`${Math.ceil(total)}${unit}`)
  }
  merged.push(...unparsed)

  if (merged.length === 0) return quantities.join(" + ")
  return merged.join(" + ")
}

/** 分数→整数四舍五入：1/2个 → 1个 */
function roundUpFraction(qty: string): string {
  const fm = qty.match(/^(\d+)\/(\d+)\s*([^\d\s]*)$/)
  if (fm) {
    const val = parseInt(fm[1]) / parseInt(fm[2])
    const unit = fm[3] || ""
    return `${Math.ceil(val)}${unit}`
  }
  return qty
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

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
    })

    // 获取食材库
    const pantryItems = await prisma.pantryItem.findMany({
      where: { userId: session.user.id },
    })
    const pantryNames: string[] = pantryItems.map((i) => i.name)

    // 将食材库名称也归一化，用于精确匹配（必须在 ingredientsWithStatus 之前定义）
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

    return NextResponse.json({ categories, stapleItems: [...stapleIncluded].sort(), total: ingredientsWithStatus.length, inPantryCount: ingredientsWithStatus.filter((i) => i.inPantry).length })
  } catch (error) {
    console.error("Grocery list GET:", error)
    return NextResponse.json({ error: "请求失败，请稍后重试" }, { status: 500 })
  }
}
