export interface DemoIngredientItem {
  name: string
  quantity: string
  inPantry: boolean
  sources: { title: string; quantity: string }[]
}

export interface DemoCategoryGroup {
  name: string
  items: DemoIngredientItem[]
}

export function getDemoGroceryList(): {
  categories: DemoCategoryGroup[]
  total: number
  inPantryCount: number
  stapleItems: string[]
} {
  const categories: DemoCategoryGroup[] = [
    {
      name: "🥩 肉类",
      items: [
        { name: "鸡胸肉", quantity: "300g", inPantry: false, sources: [{ title: "宫保鸡丁（周一午餐）", quantity: "300g" }] },
        { name: "排骨", quantity: "500g", inPantry: false, sources: [{ title: "红烧排骨（周二午餐）", quantity: "500g" }] },
        { name: "猪里脊", quantity: "300g", inPantry: false, sources: [{ title: "鱼香肉丝（周三午餐）", quantity: "150g" }, { title: "糖醋里脊（周四午餐）", quantity: "150g" }] },
        { name: "猪肉馅", quantity: "200g", inPantry: false, sources: [{ title: "豆浆+肉包子（周二早餐）", quantity: "150g" }, { title: "麻婆豆腐（周三晚餐）", quantity: "50g" }] },
        { name: "五花肉", quantity: "300g", inPantry: false, sources: [{ title: "回锅肉（周五午餐）", quantity: "300g" }] },
        { name: "草鱼/鲈鱼", quantity: "1条", inPantry: false, sources: [{ title: "水煮鱼（周六午餐）", quantity: "1条" }] },
        { name: "鸡翅", quantity: "500g", inPantry: false, sources: [{ title: "可乐鸡翅（周日上午餐）", quantity: "500g" }] },
        { name: "牛腩", quantity: "500g", inPantry: false, sources: [{ title: "西红柿炖牛腩（周日晚餐）", quantity: "500g" }] },
        { name: "牛肉末", quantity: "100g", inPantry: false, sources: [{ title: "麻婆豆腐（周三晚餐）", quantity: "50g" }] },
      ],
    },
    {
      name: "🥬 蔬菜",
      items: [
        { name: "番茄", quantity: "4个", inPantry: false, sources: [{ title: "番茄炒蛋（周一晚餐）", quantity: "3个" }, { title: "西红柿炖牛腩（周日晚餐）", quantity: "2个" }] },
        { name: "西兰花", quantity: "1颗", inPantry: false, sources: [{ title: "清炒西兰花（周二晚餐）", quantity: "1颗" }] },
        { name: "木耳", quantity: "50g", inPantry: false, sources: [{ title: "鱼香肉丝（周三午餐）", quantity: "30g" }] },
        { name: "胡萝卜", quantity: "2根", inPantry: false, sources: [{ title: "鱼香肉丝（周三午餐）", quantity: "1根" }, { title: "西红柿炖牛腩（周日晚餐）", quantity: "1根" }] },
        { name: "青椒", quantity: "2个", inPantry: false, sources: [{ title: "鱼香肉丝（周三午餐）", quantity: "2个" }] },
        { name: "豆腐", quantity: "1盒", inPantry: false, sources: [{ title: "麻婆豆腐（周三晚餐）", quantity: "1盒" }] },
        { name: "生菜", quantity: "1颗", inPantry: false, sources: [{ title: "蒜蓉生菜（周四晚餐）", quantity: "1颗" }] },
        { name: "土豆", quantity: "3个", inPantry: false, sources: [{ title: "酸辣土豆丝（周五晚餐）", quantity: "2个" }, { title: "西红柿炖牛腩（周日晚餐）", quantity: "1个" }] },
        { name: "蒜苗", quantity: "1把", inPantry: false, sources: [{ title: "回锅肉（周五午餐）", quantity: "1把" }] },
        { name: "豆芽", quantity: "200g", inPantry: false, sources: [{ title: "水煮鱼（周六午餐）", quantity: "200g" }] },
        { name: "黄瓜", quantity: "2根", inPantry: false, sources: [{ title: "凉拌黄瓜（周六晚餐）", quantity: "2根" }] },
      ],
    },
    {
      name: "🥚 蛋奶",
      items: [
        { name: "鸡蛋", quantity: "12个", inPantry: false, sources: [{ title: "小米粥+水煮蛋（周一早餐）", quantity: "2个" }, { title: "番茄炒蛋（周一晚餐）", quantity: "3个" }, { title: "煎蛋+吐司（周六早餐）", quantity: "2个" }] },
        { name: "牛奶", quantity: "1L", inPantry: false, sources: [{ title: "牛奶+全麦面包（周三早餐）", quantity: "250ml" }] },
      ],
    },
    {
      name: "🍚 主食粮油",
      items: [
        { name: "小米", quantity: "200g", inPantry: false, sources: [{ title: "小米粥+水煮蛋（周一早餐）", quantity: "100g" }] },
        { name: "大米", quantity: "2kg", inPantry: true, sources: [{ title: "番茄炒蛋+米饭（周一晚餐）", quantity: "200g" }] },
        { name: "面条", quantity: "300g", inPantry: true, sources: [] },
        { name: "食用油", quantity: "适量", inPantry: true, sources: [] },
        { name: "全麦面包", quantity: "1袋", inPantry: false, sources: [{ title: "牛奶+全麦面包（周三早餐）", quantity: "2片" }] },
      ],
    },
    {
      name: "🧂 调味料",
      items: [
        { name: "酱油", quantity: "适量", inPantry: true, sources: [] },
        { name: "醋", quantity: "适量", inPantry: true, sources: [] },
        { name: "豆瓣酱", quantity: "1瓶", inPantry: false, sources: [{ title: "麻婆豆腐（周三晚餐）", quantity: "1勺" }, { title: "回锅肉（周五午餐）", quantity: "1勺" }, { title: "水煮鱼（周六午餐）", quantity: "1勺" }] },
        { name: "冰糖", quantity: "100g", inPantry: false, sources: [{ title: "红烧排骨（周二午餐）", quantity: "30g" }] },
        { name: "花椒", quantity: "适量", inPantry: true, sources: [] },
        { name: "干辣椒", quantity: "适量", inPantry: true, sources: [] },
        { name: "番茄酱", quantity: "1瓶", inPantry: false, sources: [{ title: "糖醋里脊（周四午餐）", quantity: "2勺" }, { title: "西红柿炖牛腩（周日晚餐）", quantity: "1勺" }] },
        { name: "蚝油", quantity: "适量", inPantry: true, sources: [] },
        { name: "料酒", quantity: "适量", inPantry: true, sources: [] },
        { name: "可乐", quantity: "1罐", inPantry: false, sources: [{ title: "可乐鸡翅（周日上午餐）", quantity: "1罐" }] },
      ],
    },
  ]

  const total = categories.reduce((sum, cat) => sum + cat.items.length, 0)
  const inPantryCount = categories.reduce((sum, cat) => sum + cat.items.filter((i) => i.inPantry).length, 0)
  const stapleItems = ["盐", "糖", "淀粉", "胡椒粉", "香油", "料酒"]

  return { categories, total, inPantryCount, stapleItems }
}