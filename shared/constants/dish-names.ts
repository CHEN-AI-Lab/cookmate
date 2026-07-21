// ─── 标准菜名映射表 ───
// 将 AI 生成的不同叫法统一映射到标准菜名
// 加新菜在这里加一行即可，不需要改数据库

export const DISH_NAME_MAP: Record<string, string> = {
  // 同菜不同名的叫法 → 标准名称
  '水煮鸡蛋': '水煮蛋',
  '煮鸡蛋': '水煮蛋',
  '煎鸡蛋': '煎蛋',
  '煎荷包蛋': '煎蛋',
  '番茄炒蛋': '西红柿炒鸡蛋',
  '牛肉面': '番茄牛肉面',
  '青椒炒牛肉': '青椒牛柳',
  '干锅菜花': '干锅花菜',
  '蒸蛋羹': '鸡蛋羹',
}

/**
 * 根据标题获取标准化菜名
 * 如果映射表中有匹配，返回标准名；否则返回原标题
 * 查找时忽略大小写
 */
export function getStandardDishName(title: string): string {
  const lower = title.trim().toLowerCase()
  // 先精确匹配
  if (DISH_NAME_MAP[title.trim()]) return DISH_NAME_MAP[title.trim()]
  // 忽略大小写匹配（英文菜名）
  for (const [key, val] of Object.entries(DISH_NAME_MAP)) {
    if (key.toLowerCase() === lower) return val
  }
  return title
}