// ─── 标准菜名映射表 ───
// 将 AI 生成的不同叫法统一映射到标准菜名
// 加新菜在这里加一行即可，不需要改数据库

export const DISH_NAME_MAP: Record<string, string> = {
  // ─── 蛋类 ───
  '水煮鸡蛋': '水煮蛋',
  '水煮蛋': '水煮蛋',
  '煮鸡蛋': '水煮蛋',
  '煎蛋': '煎蛋',
  '煎鸡蛋': '煎蛋',
  '煎荷包蛋': '煎蛋',
  '炒鸡蛋': '炒鸡蛋',
  '西红柿炒鸡蛋': '西红柿炒鸡蛋',
  '番茄炒蛋': '西红柿炒鸡蛋',

  // ─── 饭面类 ───
  '酱油炒饭': '酱油炒饭',
  '葱油拌面': '葱油拌面',
  '番茄牛肉面': '番茄牛肉面',
  '牛肉面': '番茄牛肉面',
  '鲜肉馄饨': '鲜肉馄饨',
  '蛋炒饭': '蛋炒饭',

  // ─── 肉类 ───
  '宫保鸡丁': '宫保鸡丁',
  '红烧排骨': '红烧排骨',
  '土豆炖牛肉': '土豆炖牛肉',
  '咖喱鸡肉饭': '咖喱鸡肉饭',
  '蒜香鸡翅': '蒜香鸡翅',
  '麻婆豆腐': '麻婆豆腐',
  '鱼香肉丝': '鱼香肉丝',
  '糖醋里脊': '糖醋里脊',
  '回锅肉': '回锅肉',
  '水煮鱼': '水煮鱼',
  '可乐鸡翅': '可乐鸡翅',
  '西红柿炖牛腩': '西红柿炖牛腩',
  '青椒牛柳': '青椒牛柳',
  '青椒炒牛肉': '青椒牛柳',
  '干锅花菜': '干锅花菜',
  '干锅菜花': '干锅花菜',

  // ─── 汤类 ───
  '番茄蛋花汤': '番茄蛋花汤',
  '冬瓜排骨汤': '冬瓜排骨汤',
  '酸辣汤': '酸辣汤',
  '鸡蛋羹': '鸡蛋羹',
  '蒸蛋羹': '鸡蛋羹',

  // ─── 蔬菜类 ───
  '蒜蓉西兰花': '蒜蓉西兰花',
  '蒜蓉炒菜心': '蒜蓉炒菜心',
  '蒜蓉空心菜': '蒜蓉空心菜',
  '蒜蓉生菜': '蒜蓉生菜',
  '白灼西兰花': '白灼西兰花',
  '凉拌黄瓜': '凉拌黄瓜',
  '酸辣土豆丝': '酸辣土豆丝',
  '清炒西兰花': '清炒西兰花',

  // ─── 英文 ───
  'Scrambled Eggs with Tomatoes': '番茄炒蛋',
  'Tomato Scrambled Eggs': '番茄炒蛋',
  'Garlic Broccoli': '蒜蓉西兰花',
  'Soy Sauce Fried Rice': '酱油炒饭',
  'Scallion Oil Noodles': '葱油拌面',
  'Steamed Egg Custard': '鸡蛋羹',
  'Egg Custard': '鸡蛋羹',
  'Stir-fried Bok Choy with Garlic': '蒜蓉炒菜心',
  'Bok Choy': '蒜蓉炒菜心',
  'Tomato Beef Noodle Soup': '番茄牛肉面',
  'Beef and Potato Stew': '土豆炖牛肉',
  'Beef Stew': '土豆炖牛肉',
  'Beef and Pepper Stir-fry': '青椒牛柳',
  'Egg Sandwich': '鸡蛋三明治',
  'Kung Pao Chicken': '宫保鸡丁',
  'Mapo Tofu': '麻婆豆腐',
  'French Toast': '法式吐司',
  'Pancakes': '松饼',
  'Pancakes with Maple Syrup': '松饼',
  'Oatmeal': '燕麦粥',
  'Oatmeal with Berries': '水果燕麦粥',
  'Yogurt Parfait': '酸奶杯',
  'Avocado Toast': '牛油果吐司',
  'Avocado Toast with Eggs': '牛油果吐司',
  'Chicken Caesar Wrap': '鸡肉卷',
  'Caesar Wrap': '鸡肉卷',
  'Beef Tacos': '牛肉塔可',
  'Taco': '牛肉塔可',
  'Grilled Chicken with Roasted Vegetables': '烤鸡胸配蔬菜',
  'BBQ Pulled Chicken Sandwich': '手撕鸡肉三明治',
  'Vegetable Stir-fry with Rice': '蔬菜炒饭',
  'Vegetable Stir-fry': '蔬菜炒饭',
  'Minestrone Soup': '蔬菜汤',
  'Tomato Basil Pasta': '番茄罗勒意面',
  'Pasta': '番茄罗勒意面',
  'Chicken Stir-fry with Vegetables': '鸡肉炒蔬菜',
  'Garlic Butter Salmon': '蒜香黄油三文鱼',
  'Salmon': '蒜香黄油三文鱼',
  'Scrambled Eggs on Toast': '煎蛋吐司',
  'Steamed Fish': '清蒸鱼',
  'Teriyaki Chicken': '照烧鸡',
  'Kimchi Fried Rice': '泡菜炒饭',
  'Yu Xiang Shredded Pork': '鱼香肉丝',
  'Thai Green Curry': '泰式绿咖喱',
  'Japanese Curry Rice': '日式咖喱饭',
  'Butter Chicken': '黄油鸡',
  'Korean BBQ': '韩式烤肉',
  'Kebab': '烤肉串',
  'Samosa': '咖喱角',
  'Vietnamese Pho': '越南河粉',
  'Falafel': '法拉费',
  'Fresh Meat Wontons': '鲜肉馄饨',
  'Century Egg & Pork Congee': '皮蛋瘦肉粥',
  'Soy Milk + Meat Buns': '豆浆肉包',
  'Milk + Whole Wheat Bread': '牛奶面包',
  'Fried Egg + Toast': '煎蛋吐司',
  'Millet Porridge + Boiled Eggs': '小米粥',
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