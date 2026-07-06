export interface DemoRecipe {
  id: string
  title: string
  description: string | null
  ingredients: string
  steps: string
  cookingTime: number | null
  calories: number | null
  cuisineType: string | null
  difficulty: string | null
  starred: boolean
  createdAt: string
}

export function getDemoRecipes(): DemoRecipe[] {
  const now = new Date()
  return [
    {
      id: "demo-rec-1",
      title: "宫保鸡丁",
      description: "经典川菜，鸡丁嫩滑、花生酥脆、麻辣鲜香。",
      ingredients: "鸡胸肉、花生米、干辣椒、花椒、葱、姜、蒜、酱油、醋、糖、淀粉",
      steps: "鸡胸肉切丁，加料酒、淀粉腌制15分钟。\n调汁：酱油、醋、糖、淀粉、水调匀。\n花生米小火炒至金黄备用。\n热锅凉油，爆香干辣椒和花椒。\n下鸡丁翻炒至变色。\n加入葱姜蒜爆香。\n倒入调好的汁翻炒均匀。\n最后加入花生米翻炒出锅。",
      cookingTime: 25,
      calories: 480,
      cuisineType: "川菜",
      difficulty: "medium",
      starred: true,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-2",
      title: "红烧排骨",
      description: "色泽红亮、肉质酥烂的经典红烧菜。",
      ingredients: "排骨、酱油、老抽、冰糖、八角、桂皮、姜、葱、料酒",
      steps: "排骨冷水下锅焯水去血沫。\n锅中放少许油，炒冰糖至琥珀色。\n下排骨翻炒上色。\n加酱油、老抽、料酒翻炒。\n加没过排骨的热水，放入八角桂皮姜片。\n大火烧开转小火炖40分钟。\n大火收汁，撒葱花出锅。",
      cookingTime: 55,
      calories: 550,
      cuisineType: "家常菜",
      difficulty: "medium",
      starred: true,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-3",
      title: "番茄炒蛋",
      description: "国民家常菜，酸甜可口的番茄配上嫩滑的鸡蛋。",
      ingredients: "番茄、鸡蛋、葱、盐、糖、食用油",
      steps: "鸡蛋打散加少许盐。\n番茄切块。\n热油炒鸡蛋至定型盛出。\n同一锅炒番茄出汁。\n加少许糖提鲜。\n倒回鸡蛋翻炒均匀。\n撒上葱花出锅。",
      cookingTime: 20,
      calories: 420,
      cuisineType: "家常菜",
      difficulty: "easy",
      starred: true,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-4",
      title: "麻婆豆腐",
      description: "麻辣鲜香的经典川菜，豆腐嫩滑入味。",
      ingredients: "嫩豆腐、猪肉末、豆瓣酱、花椒粉、辣椒粉、葱、姜、蒜、淀粉",
      steps: "豆腐切块，热水烫一下。\n热锅放油，下肉末炒散。\n加豆瓣酱炒出红油。\n加姜蒜末爆香。\n加适量水烧开。\n放入豆腐轻轻推动。\n加花椒粉、辣椒粉调味。\n水淀粉勾芡，撒葱花出锅。",
      cookingTime: 18,
      calories: 380,
      cuisineType: "川菜",
      difficulty: "easy",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-5",
      title: "可乐鸡翅",
      description: "甜香软嫩的经典家常菜，可乐的焦糖味让鸡翅格外美味。",
      ingredients: "鸡翅、可乐、酱油、姜、料酒",
      steps: "鸡翅洗净划两刀。\n冷水下锅焯水去血沫。\n锅中放少许油，下鸡翅煎至两面金黄。\n倒入可乐没过鸡翅。\n加酱油、姜片、料酒。\n大火烧开转中小火炖15分钟。\n开大火收汁至浓稠裹在鸡翅上。",
      cookingTime: 30,
      calories: 420,
      cuisineType: "家常菜",
      difficulty: "easy",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-6",
      title: "鱼香肉丝",
      description: "川菜经典，酸甜微辣，肉丝嫩滑，下饭神器。",
      ingredients: "猪里脊、木耳、胡萝卜、青椒、葱姜蒜、豆瓣酱、醋、糖、酱油、淀粉",
      steps: "里脊肉切丝，加料酒、淀粉腌制。\n木耳泡发切丝，胡萝卜切丝，青椒切丝。\n调鱼香汁：醋、糖、酱油、淀粉、水调匀。\n热锅凉油，下肉丝滑熟盛出。\n锅中留底油，下豆瓣酱炒出红油。\n加葱姜蒜爆香。\n下木耳丝、胡萝卜丝、青椒丝翻炒。\n倒入肉丝和鱼香汁翻炒均匀。",
      cookingTime: 22,
      calories: 450,
      cuisineType: "川菜",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-7",
      title: "糖醋里脊",
      description: "外酥里嫩的经典糖醋菜，酸甜开胃。",
      ingredients: "猪里脊、鸡蛋、面粉、淀粉、番茄酱、醋、糖、盐",
      steps: "里脊切条，加盐、料酒腌制。\n鸡蛋、面粉、淀粉调成糊。\n里脊裹糊，六成热油炸至金黄。\n捞出复炸一次使外皮更酥脆。\n锅留底油，加番茄酱、糖、醋炒匀。\n倒入炸好的里脊翻炒均匀。",
      cookingTime: 30,
      calories: 500,
      cuisineType: "家常菜",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-8",
      title: "回锅肉",
      description: "四川名菜，五花肉焦香软糯，配蒜苗一起炒香辣过瘾。",
      ingredients: "五花肉、蒜苗、豆瓣酱、豆豉、姜、蒜、料酒、糖",
      steps: "五花肉整块冷水下锅，加姜片料酒煮20分钟。\n捞出放凉切薄片。\n蒜苗斜切成段。\n锅不放油，直接将肉片下锅煎至微卷出油。\n加入豆瓣酱、豆豉、蒜片翻炒。\n加少许糖调味。\n最后加入蒜苗段翻炒至断生。",
      cookingTime: 35,
      calories: 520,
      cuisineType: "川菜",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },
  ]
}