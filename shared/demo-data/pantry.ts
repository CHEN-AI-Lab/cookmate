export interface DemoPantryItem {
  id: string
  name: string
  category: string | null
}

export function getDemoPantryItems(): DemoPantryItem[] {
  return [
    { id: "demo-pantry-1", name: "大米", category: "🍚 主食粮油" },
    { id: "demo-pantry-2", name: "面条", category: "🍚 主食粮油" },
    { id: "demo-pantry-3", name: "鸡蛋", category: "🥚 蛋奶" },
    { id: "demo-pantry-4", name: "食用油", category: "🍚 主食粮油" },
    { id: "demo-pantry-5", name: "酱油", category: "🧂 调味料" },
    { id: "demo-pantry-6", name: "醋", category: "🧂 调味料" },
    { id: "demo-pantry-7", name: "料酒", category: "🧂 调味料" },
    { id: "demo-pantry-8", name: "盐", category: "🧂 调味料" },
    { id: "demo-pantry-9", name: "糖", category: "🧂 调味料" },
    { id: "demo-pantry-10", name: "淀粉", category: "🧂 调味料" },
    { id: "demo-pantry-11", name: "花椒", category: "🧂 调味料" },
    { id: "demo-pantry-12", name: "干辣椒", category: "🧂 调味料" },
    { id: "demo-pantry-13", name: "蚝油", category: "🧂 调味料" },
    { id: "demo-pantry-14", name: "香油", category: "🧂 调味料" },
    { id: "demo-pantry-15", name: "大蒜", category: "🥬 蔬菜" },
    { id: "demo-pantry-16", name: "姜", category: "🥬 蔬菜" },
    { id: "demo-pantry-17", name: "葱", category: "🥬 蔬菜" },
    { id: "demo-pantry-18", name: "洋葱", category: "🥬 蔬菜" },
    { id: "demo-pantry-19", name: "番茄", category: "🥬 蔬菜" },
    { id: "demo-pantry-20", name: "土豆", category: "🥬 蔬菜" },
    { id: "demo-pantry-21", name: "胡萝卜", category: "🥬 蔬菜" },
    { id: "demo-pantry-22", name: "豆腐", category: "🥬 蔬菜" },
  ]
}