// ─── Grocery Parser Utilities ───
// 食材字符串解析、数量合并等

import { normalizeIngredientName } from "./grocery-categories"

// ====== 中文数字映射 ======
const CHINESE_NUMBERS: Record<string, string> = {
  一: "1", 二: "2", 三: "3", 四: "4", 五: "5",
  六: "6", 七: "7", 八: "8", 九: "9", 十: "10",
  两: "2", 半: "0.5", 零: "0",
}

/** 分数→整数四舍五入：1/2个 → 1个 */
export function roundUpFraction(qty: string): string {
  const fm = qty.match(/^(\d+)\/(\d+)\s*([^\d\s]*)$/)
  if (fm) {
    const val = parseInt(fm[1]) / parseInt(fm[2])
    const unit = fm[3] || ""
    return `${Math.ceil(val)}${unit}`
  }
  return qty
}

/** 数量合并：同单位数值相加，含"适量"则只显示适量 */
export function mergeQuantities(quantities: string[]): string {
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

/** 解析食材字符串，提取名称和数量 */
export function parseIngredient(raw: string): { name: string; quantity: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { name: "", quantity: "" }

  // 预清理：去掉末尾括号里的克数/重量（"鲈鱼 1条(300g)" → "鲈鱼 1条"）
  const bare = trimmed.replace(/\s*\([^)]*[\d.][^)]*\)\s*$/, '').trim()

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
    const name = numMatch[1]
    const unit = numMatch[3] || ""
    return { name, quantity: `${numMatch[2]}${unit}` }
  }

  // 正则1.5：分数+单位（"1/2个"、"1/4勺"）
  const fracMatch = bare.match(/^(.+?)\s+(\d+)\/(\d+)\s*(个|只|片|根|条|块|克|斤|两|盒|袋|包|瓶|罐|kg|g|ml|l|勺|碗|杯|份|瓣|颗|粒|段)?\s*$/)
  if (fracMatch) {
    const name = fracMatch[1]
    const unit = fracMatch[4] || ""
    return { name, quantity: `${fracMatch[2]}/${fracMatch[3]}${unit}` }
  }

  // 正则2：中文数字+量词/单位（"一块"、"两根"、"半块"、"少许"）
  const cnMatch = bare.match(/^(.+?)\s+([一二三四五六七八九十两半]+|少许|适量|若干|少量)\s*(个|只|片|根|条|块|盒|袋|包|瓶|罐|瓣|颗|粒|段)?\s*$/)
  if (cnMatch) {
    const name = cnMatch[1]
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