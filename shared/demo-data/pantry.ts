export interface DemoPantryItem {
  id: string
  name: string
  category: string | null
}

/**
 * 体验模式（Demo）示例食材。
 * 纯前端静态数据，不写数据库 —— 体验用户看到的一切都来自这里。
 * 增删条目后，记得同步 apps/web/src/app/[locale]/app/dashboard/page.tsx 的食材数量。
 */
export function getDemoPantryItems(): DemoPantryItem[] {
  return [
    { id: "demo-pantry-1", name: "大米", category: "🍚 主食粮油" },
    { id: "demo-pantry-2", name: "面条", category: "🍚 主食粮油" },
    { id: "demo-pantry-3", name: "面粉", category: "🍚 主食粮油" },
    { id: "demo-pantry-4", name: "食用油", category: "🍚 主食粮油" },
    { id: "demo-pantry-5", name: "淀粉", category: "🍚 主食粮油" },
    { id: "demo-pantry-6", name: "鸡蛋", category: "🥩 肉禽蛋" },
    { id: "demo-pantry-7", name: "鸡胸肉", category: "🥩 肉禽蛋" },
    { id: "demo-pantry-8", name: "猪肉", category: "🥩 肉禽蛋" },
    { id: "demo-pantry-9", name: "牛肉", category: "🥩 肉禽蛋" },
    { id: "demo-pantry-10", name: "牛奶", category: "🥛 乳品豆制品" },
    { id: "demo-pantry-11", name: "酸奶", category: "🥛 乳品豆制品" },
    { id: "demo-pantry-12", name: "豆腐", category: "🥛 乳品豆制品" },
    { id: "demo-pantry-13", name: "大蒜", category: "🥬 蔬菜" },
    { id: "demo-pantry-14", name: "姜", category: "🥬 蔬菜" },
    { id: "demo-pantry-15", name: "葱", category: "🥬 蔬菜" },
    { id: "demo-pantry-16", name: "洋葱", category: "🥬 蔬菜" },
    { id: "demo-pantry-17", name: "番茄", category: "🥬 蔬菜" },
    { id: "demo-pantry-18", name: "土豆", category: "🥬 蔬菜" },
    { id: "demo-pantry-19", name: "胡萝卜", category: "🥬 蔬菜" },
    { id: "demo-pantry-20", name: "西兰花", category: "🥬 蔬菜" },
    { id: "demo-pantry-21", name: "白菜", category: "🥬 蔬菜" },
    { id: "demo-pantry-22", name: "青椒", category: "🥬 蔬菜" },
    { id: "demo-pantry-23", name: "香菇", category: "🥬 蔬菜" },
    { id: "demo-pantry-24", name: "黄瓜", category: "🥬 蔬菜" },
    { id: "demo-pantry-25", name: "酱油", category: "🧂 调味料" },
    { id: "demo-pantry-26", name: "醋", category: "🧂 调味料" },
    { id: "demo-pantry-27", name: "料酒", category: "🧂 调味料" },
    { id: "demo-pantry-28", name: "盐", category: "🧂 调味料" },
    { id: "demo-pantry-29", name: "糖", category: "🧂 调味料" },
    { id: "demo-pantry-30", name: "蚝油", category: "🧂 调味料" },
    { id: "demo-pantry-31", name: "香油", category: "🧂 调味料" },
    { id: "demo-pantry-32", name: "苹果", category: "🍎 水果" },
    { id: "demo-pantry-33", name: "香蕉", category: "🍎 水果" },
    { id: "demo-pantry-34", name: "柠檬", category: "🍎 水果" },
  ]
}
