// Demo meal plan — 7 days x 3 meals with realistic recipes
export interface DemoRecipe {
  id: string
  title: string
  description: string
  ingredients: string
  steps: string
  cookingTime: number
  calories: number
  cuisineType: string
  starred: boolean
}

export interface DemoSlot {
  id: string
  dayOfWeek: number
  mealType: string
  recipe: DemoRecipe | null
  note: string
}

export interface DemoMealPlan {
  id: string
  weekStart: string
  slots: DemoSlot[]
}

const recipes: Record<string, DemoRecipe> = {
  "小米粥+水煮蛋": {
    id: "demo-recipe-1",
    title: "小米粥+水煮蛋",
    description: "一碗温热的小米粥配上两个水煮蛋，简单又营养的中式早餐。",
    ingredients: "小米,水,鸡蛋",
    steps: "1.小米淘洗干净\n2.锅中加水烧开，放入小米\n3.小火熬煮20分钟\n4.鸡蛋冷水下锅，水开后煮8分钟\n5.捞出鸡蛋过凉水即可",
    cookingTime: 25,
    calories: 350,
    cuisineType: "中式",
    starred: false,
  },
  "宫保鸡丁": {
    id: "demo-recipe-2",
    title: "宫保鸡丁",
    description: "经典川菜，鸡丁嫩滑、花生酥脆、麻辣鲜香。",
    ingredients: "鸡胸肉,花生米,干辣椒,花椒,葱,姜,蒜,酱油,醋,糖,淀粉",
    steps: "1.鸡胸肉切丁，加料酒、淀粉腌制15分钟\n2.调汁：酱油、醋、糖、淀粉、水调匀\n3.花生米小火炒至金黄备用\n4.热锅凉油，爆香干辣椒和花椒\n5.下鸡丁翻炒至变色\n6.加入葱姜蒜爆香\n7.倒入调好的汁翻炒均匀\n8.最后加入花生米翻炒出锅",
    cookingTime: 25,
    calories: 480,
    cuisineType: "川菜",
    starred: false,
  },
  "番茄炒蛋+米饭": {
    id: "demo-recipe-3",
    title: "番茄炒蛋+米饭",
    description: "国民家常菜，酸甜可口的番茄配上嫩滑的鸡蛋，下饭首选。",
    ingredients: "番茄,鸡蛋,葱,盐,糖,食用油,大米",
    steps: "1.鸡蛋打散加少许盐\n2.番茄切块\n3.热油炒鸡蛋至定型盛出\n4.同一锅炒番茄出汁\n5.加少许糖提鲜\n6.倒回鸡蛋翻炒均匀\n7.撒上葱花出锅",
    cookingTime: 20,
    calories: 420,
    cuisineType: "家常",
    starred: false,
  },
  "豆浆+肉包子": {
    id: "demo-recipe-4",
    title: "豆浆+肉包子",
    description: "香浓豆浆配上鲜肉包子，经典中式早餐组合。",
    ingredients: "黄豆,水,面粉,猪肉馅,葱,姜,酱油,盐",
    steps: "1.黄豆提前泡发\n2.用豆浆机打成豆浆\n3.面粉加酵母揉面发酵\n4.肉馅加葱姜末、酱油、盐调匀\n5.包好包子醒发15分钟\n6.上锅蒸15分钟即可",
    cookingTime: 35,
    calories: 450,
    cuisineType: "中式",
    starred: false,
  },
  "红烧排骨": {
    id: "demo-recipe-5",
    title: "红烧排骨",
    description: "色泽红亮、肉质酥烂的经典红烧菜。",
    ingredients: "排骨,酱油,老抽,冰糖,八角,桂皮,姜,葱,料酒",
    steps: "1.排骨冷水下锅焯水去血沫\n2.锅中放少许油，炒冰糖至琥珀色\n3.下排骨翻炒上色\n4.加酱油、老抽、料酒翻炒\n5.加没过排骨的热水，放入八角桂皮姜片\n6.大火烧开转小火炖40分钟\n7.大火收汁，撒葱花出锅",
    cookingTime: 55,
    calories: 550,
    cuisineType: "家常",
    starred: false,
  },
  "清炒西兰花": {
    id: "demo-recipe-6",
    title: "清炒西兰花",
    description: "清爽脆嫩的快手素菜，健康低卡。",
    ingredients: "西兰花,蒜,盐,食用油",
    steps: "1.西兰花掰小朵，洗净\n2.烧一锅水，加少许盐和油\n3.水开后放入西兰花焯1分钟\n4.捞出过凉水沥干\n5.热锅放油，爆香蒜末\n6.放入西兰花大火快炒\n7.加盐调味出锅",
    cookingTime: 12,
    calories: 120,
    cuisineType: "家常",
    starred: false,
  },
  "牛奶+全麦面包": {
    id: "demo-recipe-7",
    title: "牛奶+全麦面包",
    description: "简单便捷的西式早餐，适合快节奏的早晨。",
    ingredients: "牛奶,全麦面包",
    steps: "1.牛奶加热至温热\n2.全麦面包烤至微焦\n3.搭配享用",
    cookingTime: 5,
    calories: 280,
    cuisineType: "西式",
    starred: false,
  },
  "鱼香肉丝": {
    id: "demo-recipe-8",
    title: "鱼香肉丝",
    description: "川菜经典，酸甜微辣，肉丝嫩滑，下饭神器。",
    ingredients: "猪里脊,木耳,胡萝卜,青椒,葱姜蒜,豆瓣酱,醋,糖,酱油,淀粉",
    steps: "1.里脊肉切丝，加料酒、淀粉腌制\n2.木耳泡发切丝，胡萝卜切丝，青椒切丝\n3.调鱼香汁：醋、糖、酱油、淀粉、水调匀\n4.热锅凉油，下肉丝滑熟盛出\n5.锅中留底油，下豆瓣酱炒出红油\n6.加葱姜蒜爆香\n7.下木耳丝、胡萝卜丝、青椒丝翻炒\n8.倒入肉丝和鱼香汁翻炒均匀",
    cookingTime: 22,
    calories: 450,
    cuisineType: "川菜",
    starred: false,
  },
  "麻婆豆腐": {
    id: "demo-recipe-9",
    title: "麻婆豆腐",
    description: "麻辣鲜香的经典川菜，豆腐嫩滑入味。",
    ingredients: "嫩豆腐,猪肉末,豆瓣酱,花椒粉,辣椒粉,葱,姜,蒜,淀粉",
    steps: "1.豆腐切块，热水烫一下\n2.热锅放油，下肉末炒散\n3.加豆瓣酱炒出红油\n4.加姜蒜末爆香\n5.加适量水烧开\n6.放入豆腐轻轻推动\n7.加花椒粉、辣椒粉调味\n8.水淀粉勾芡，撒葱花出锅",
    cookingTime: 18,
    calories: 380,
    cuisineType: "川菜",
    starred: false,
  },
  "皮蛋瘦肉粥": {
    id: "demo-recipe-10",
    title: "皮蛋瘦肉粥",
    description: "绵密顺滑的广式经典粥品，鲜美可口。",
    ingredients: "大米,皮蛋,瘦肉,姜,葱,盐,料酒",
    steps: "1.大米淘洗后浸泡30分钟\n2.瘦肉切丝，加料酒、姜丝腌制\n3.皮蛋切丁\n4.锅中加水烧开，放入大米\n5.小火熬煮30分钟至粥绵密\n6.加入瘦肉丝搅散\n7.加入皮蛋丁煮3分钟\n8.加盐调味，撒葱花",
    cookingTime: 40,
    calories: 380,
    cuisineType: "粤式",
    starred: false,
  },
  "糖醋里脊": {
    id: "demo-recipe-11",
    title: "糖醋里脊",
    description: "外酥里嫩的经典糖醋菜，酸甜开胃。",
    ingredients: "猪里脊,鸡蛋,面粉,淀粉,番茄酱,醋,糖,盐",
    steps: "1.里脊切条，加盐、料酒腌制\n2.鸡蛋、面粉、淀粉调成糊\n3.里脊裹糊，六成热油炸至金黄\n4.捞出复炸一次使外皮更酥脆\n5.锅留底油，加番茄酱、糖、醋炒匀\n6.倒入炸好的里脊翻炒均匀",
    cookingTime: 30,
    calories: 500,
    cuisineType: "家常",
    starred: false,
  },
  "蒜蓉生菜": {
    id: "demo-recipe-12",
    title: "蒜蓉生菜",
    description: "清脆爽口的快手素菜，蒜香四溢。",
    ingredients: "生菜,蒜,蚝油,食用油",
    steps: "1.生菜洗净掰开\n2.大蒜切末\n3.锅中烧水，水开后放入生菜焯30秒\n4.捞出摆盘\n5.热锅放油，爆香蒜末\n6.加蚝油和少许水炒匀\n7.淋在生菜上",
    cookingTime: 8,
    calories: 80,
    cuisineType: "家常",
    starred: false,
  },
  "燕麦片+坚果": {
    id: "demo-recipe-13",
    title: "燕麦片+坚果",
    description: "高纤维健康早餐，搭配坚果补充优质脂肪。",
    ingredients: "燕麦片,牛奶,核桃仁,杏仁,蜂蜜",
    steps: "1.燕麦片中加入热牛奶\n2.放上核桃仁和杏仁\n3.淋上少许蜂蜜调味",
    cookingTime: 5,
    calories: 320,
    cuisineType: "西式",
    starred: false,
  },
  "回锅肉": {
    id: "demo-recipe-14",
    title: "回锅肉",
    description: "四川名菜，五花肉焦香软糯，配蒜苗一起炒香辣过瘾。",
    ingredients: "五花肉,蒜苗,豆瓣酱,豆豉,姜,蒜,料酒,糖",
    steps: "1.五花肉整块冷水下锅，加姜片料酒煮20分钟\n2.捞出放凉切薄片\n3.蒜苗斜切成段\n4.锅不放油，直接将肉片下锅煎至微卷出油\n5.加入豆瓣酱、豆豉、蒜片翻炒\n6.加少许糖调味\n7.最后加入蒜苗段翻炒至断生",
    cookingTime: 35,
    calories: 520,
    cuisineType: "川菜",
    starred: false,
  },
  "酸辣土豆丝": {
    id: "demo-recipe-15",
    title: "酸辣土豆丝",
    description: "家常快手菜，酸辣爽脆，百吃不厌。",
    ingredients: "土豆,干辣椒,花椒,醋,盐,葱,食用油",
    steps: "1.土豆切细丝，泡水去淀粉\n2.冲洗几遍沥干水分\n3.热锅放油，爆香干辣椒和花椒\n4.下土豆丝大火快炒\n5.加醋、盐调味\n6.翻炒均匀，撒葱花出锅",
    cookingTime: 12,
    calories: 180,
    cuisineType: "家常",
    starred: false,
  },
  "煎蛋+吐司": {
    id: "demo-recipe-16",
    title: "煎蛋+吐司",
    description: "经典便捷的周末早餐。",
    ingredients: "鸡蛋,吐司面包,黄油,盐,胡椒",
    steps: "1.吐司面包烤至两面微焦\n2.平底锅融化黄油\n3.打入鸡蛋，小火煎至蛋白凝固\n4.撒少许盐和胡椒\n5.煎蛋放在吐司上享用",
    cookingTime: 8,
    calories: 300,
    cuisineType: "西式",
    starred: false,
  },
  "水煮鱼": {
    id: "demo-recipe-17",
    title: "水煮鱼",
    description: "经典的川菜大菜，鱼肉嫩滑，麻辣鲜香。",
    ingredients: "草鱼/鲈鱼,豆芽,干辣椒,花椒,豆瓣酱,姜,蒜,料酒,淀粉,蛋清",
    steps: "1.鱼片成薄片，加料酒、蛋清、淀粉腌制\n2.豆芽焯水铺在碗底\n3.锅中放油，下豆瓣酱炒出红油\n4.加姜蒜末爆香，加适量水烧开\n5.鱼片逐片下锅，煮至变白捞出\n6.铺在豆芽上，浇上汤汁\n7.撒上干辣椒和花椒\n8.浇热油激发出香味",
    cookingTime: 35,
    calories: 450,
    cuisineType: "川菜",
    starred: false,
  },
  "凉拌黄瓜": {
    id: "demo-recipe-18",
    title: "凉拌黄瓜",
    description: "清脆爽口的凉菜，解腻开胃。",
    ingredients: "黄瓜,蒜,醋,酱油,糖,辣椒油,芝麻",
    steps: "1.黄瓜拍碎后切段\n2.大蒜切末\n3.调汁：醋、酱油、糖、辣椒油调匀\n4.将料汁浇在黄瓜上\n5.撒上蒜末和芝麻拌匀即可",
    cookingTime: 10,
    calories: 60,
    cuisineType: "家常",
    starred: false,
  },
  "鲜肉馄饨": {
    id: "demo-recipe-19",
    title: "鲜肉馄饨",
    description: "皮薄馅大的鲜肉馄饨，汤鲜味美。",
    ingredients: "馄饨皮,猪肉馅,葱,姜,酱油,盐,香油,紫菜,虾皮",
    steps: "1.猪肉馅加葱姜末、酱油、盐、香油调匀\n2.取馄饨皮包入肉馅\n3.锅中烧水，水开下馄饨\n4.煮至馄饨浮起再煮1分钟\n5.碗中放紫菜、虾皮、葱花\n6.连汤带馄饨盛入碗中",
    cookingTime: 25,
    calories: 350,
    cuisineType: "中式",
    starred: false,
  },
  "可乐鸡翅": {
    id: "demo-recipe-20",
    title: "可乐鸡翅",
    description: "甜香软嫩的经典家常菜，可乐的焦糖味让鸡翅格外美味。",
    ingredients: "鸡翅,可乐,酱油,姜,料酒",
    steps: "1.鸡翅洗净划两刀\n2.冷水下锅焯水去血沫\n3.锅中放少许油，下鸡翅煎至两面金黄\n4.倒入可乐没过鸡翅\n5.加酱油、姜片、料酒\n6.大火烧开转中小火炖15分钟\n7.开大火收汁至浓稠裹在鸡翅上",
    cookingTime: 30,
    calories: 420,
    cuisineType: "家常",
    starred: false,
  },
  "西红柿炖牛腩": {
    id: "demo-recipe-21",
    title: "西红柿炖牛腩",
    description: "酸甜浓郁的大菜，牛腩软烂，汤汁拌饭绝配。",
    ingredients: "牛腩,西红柿,土豆,胡萝卜,洋葱,姜,番茄酱,盐,料酒",
    steps: "1.牛腩切块焯水\n2.西红柿切块，土豆胡萝卜切块\n3.热锅放油，炒软西红柿\n4.加番茄酱炒出红油\n5.放入牛腩翻炒\n6.加没过食材的热水\n7.大火烧开转小火炖1.5小时\n8.加入土豆胡萝卜继续炖20分钟\n9.加盐调味出锅",
    cookingTime: 120,
    calories: 520,
    cuisineType: "家常",
    starred: false,
  },
}

const dayRecipes: [string, string, string][] = [
  ["小米粥+水煮蛋", "宫保鸡丁", "番茄炒蛋+米饭"],
  ["豆浆+肉包子", "红烧排骨", "清炒西兰花"],
  ["牛奶+全麦面包", "鱼香肉丝", "麻婆豆腐"],
  ["皮蛋瘦肉粥", "糖醋里脊", "蒜蓉生菜"],
  ["燕麦片+坚果", "回锅肉", "酸辣土豆丝"],
  ["煎蛋+吐司", "水煮鱼", "凉拌黄瓜"],
  ["鲜肉馄饨", "可乐鸡翅", "西红柿炖牛腩"],
]

const mealTypeKeys = ["breakfast", "lunch", "dinner"] as const

function getMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - ((day + 6) % 7)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

export function getDemoMealPlan(): DemoMealPlan {
  const weekStart = getMonday()
  const slots: DemoSlot[] = []

  dayRecipes.forEach((meals, dayIdx) => {
    meals.forEach((recipeTitle, mealIdx) => {
      const mealType = mealTypeKeys[mealIdx]
      const recipe = recipes[recipeTitle]
      slots.push({
        id: `demo-slot-${dayIdx}-${mealType}`,
        dayOfWeek: dayIdx,
        mealType,
        recipe: { ...recipe, id: `demo-recipe-${dayIdx}-${mealType}` },
        note: recipe.description.substring(0, 100),
      })
    })
  })

  return { id: "demo-meal-plan", weekStart, slots }
}