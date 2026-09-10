export interface DemoPantryItem {
  id: string
  name: string
  category: string | null
}

/**
 * 体验模式（Demo）示例食材。
 * 纯前端静态数据，不写数据库 —— 体验用户看到的一切都来自这里。
 * 只放常见食材，够演示即可（约 10 种）；增删条目后记得同步
 * apps/web/src/app/[locale]/app/dashboard/page.tsx 里的食材数量。
 */
export function getDemoPantryItems(): DemoPantryItem[] {
  return [
    { id: "demo-pantry-1", name: "大米", category: "🍚 主食粮油" },
    { id: "demo-pantry-2", name: "鸡蛋", category: "🥩 肉禽蛋" },
    { id: "demo-pantry-3", name: "鸡胸肉", category: "🥩 肉禽蛋" },
    { id: "demo-pantry-4", name: "牛奶", category: "🥛 乳品豆制品" },
    { id: "demo-pantry-5", name: "豆腐", category: "🥛 乳品豆制品" },
    { id: "demo-pantry-6", name: "番茄", category: "🥬 蔬菜" },
    { id: "demo-pantry-7", name: "土豆", category: "🥬 蔬菜" },
    { id: "demo-pantry-8", name: "胡萝卜", category: "🥬 蔬菜" },
    { id: "demo-pantry-9", name: "酱油", category: "🧂 调味料" },
    { id: "demo-pantry-10", name: "盐", category: "🧂 调味料" },
  ]
}
