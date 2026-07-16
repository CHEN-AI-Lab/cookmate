// 共享常量 — 引导页与设置页保持一致
// 修改其中任何一个时请同步另一个，或者直接改这里

export const DIET_OPTIONS = ["不限", "减脂", "增肌", "素食", "低碳水", "无麸质"] as const

export const CUISINE_OPTIONS = ["中餐", "西餐", "日料", "韩餐", "东南亚", "印度菜", "中东菜", "墨西哥菜"] as const

export const CUISINE_LABELS: Record<string, string> = {
  "中餐": "Chinese Cuisine",
  "西餐": "Western Cuisine",
  "日料": "Japanese Cuisine",
  "韩餐": "Korean Cuisine",
  "东南亚": "Southeast Asian Cuisine",
  "印度菜": "Indian Cuisine",
  "中东菜": "Middle Eastern Cuisine",
  "墨西哥菜": "Mexican Cuisine",
}

export const SERVING_SIZE_OPTIONS = [1, 2, 3, 4, 5, 6] as const
